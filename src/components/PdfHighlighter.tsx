import type { PDFDocumentProxy } from "pdfjs-dist";
import type { EventBus, PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";
import type { PDFViewerOptions } from "pdfjs-dist/types/web/pdf_viewer";
import React, {
  type PointerEventHandler,
  PureComponent,
  type RefObject,
} from "react";
import { type Root, createRoot } from "react-dom/client";
import { debounce } from "ts-debounce";
import { scaledToViewport, viewportToScaled } from "../lib/coordinates";
import { getAreaAsPNG } from "../lib/get-area-as-png";
import { getBoundingRect } from "../lib/get-bounding-rect";
import { getClientRects } from "../lib/get-client-rects";
import {
  findOrCreateContainerLayer,
  getPageFromElement,
  getPagesFromRange,
  getWindow,
  isHTMLElement,
} from "../lib/pdfjs-dom";
import styles from "../style/PdfHighlighter.module.css";
import type {
  IHighlight,
  LTWH,
  LTWHP,
  Position,
  Scaled,
  ScaledPosition,
  HighlightHooks,
  HighlightCreatePayload,
} from "../types";
import { AreaHighlight } from "./AreaHighlight";
import { Highlight } from "./Highlight";
import { HighlightLayer } from "./HighlightLayer";
import { MouseSelection } from "./MouseSelection";
import { TipContainer } from "./TipContainer";

export type T_ViewportHighlight<T_HT> = { position: Position } & T_HT;

interface State<T_HT> {
  ghostHighlight: {
    position: ScaledPosition;
    content?: { text?: string; image?: string };
  } | null;
  isCollapsed: boolean;
  range: Range | null;
  tip: {
    highlight: T_ViewportHighlight<T_HT>;
    callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element;
  } | null;
  tipPosition: Position | null;
  tipChildren: JSX.Element | null;
  tipMode: "hover" | "selection" | null;
  isAreaSelectionInProgress: boolean;
  scrolledToHighlightId: string;
  isTipHovered: boolean;
  isHighlightHovered: boolean;
}

interface Props<T_HT> extends HighlightHooks {
  highlightTransform?: (
    highlight: T_ViewportHighlight<T_HT>,
    index: number,
    setTip: (
      highlight: T_ViewportHighlight<T_HT>,
      callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element,
    ) => void,
    hideTip: () => void,
    viewportToScaled: (rect: LTWHP) => Scaled,
    screenshot: (position: LTWH) => string,
    isScrolledTo: boolean,
  ) => JSX.Element;
  renderPopup?: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element | null;
  onHighlightHover?: (highlight: T_ViewportHighlight<T_HT>) => void;
  onHighlightBlur?: (highlight: T_ViewportHighlight<T_HT>) => void;
  debug?: boolean;
  highlights: Array<T_HT>;
  onScrollChange: () => void;
  scrollRef: (scrollTo: (highlight: T_HT) => void) => void;
  pdfDocument: PDFDocumentProxy;
  pdfScaleValue: string;
  onSelectionFinished?: (
    position: ScaledPosition,
    content: { text?: string; image?: string },
    hideTipAndSelection: () => void,
    transformSelection: () => void,
  ) => JSX.Element | null;
  enableAreaSelection: (event: MouseEvent) => boolean;
  pdfViewerOptions?: PDFViewerOptions;
  onTextLayerReady?: (pageNumber: number) => void;
  onDocumentReady?: () => void;
  forceRenderOnLoad?: boolean;
}

const EMPTY_ID = "empty-id";

export class PdfHighlighter<T_HT extends IHighlight> extends PureComponent<
  Props<T_HT>,
  State<T_HT>
> {
  static defaultProps = {
    pdfScaleValue: "auto",
    forceRenderOnLoad: true,
  };

  state: State<T_HT> = {
    ghostHighlight: null,
    isCollapsed: true,
    range: null,
    scrolledToHighlightId: EMPTY_ID,
    isAreaSelectionInProgress: false,
    tip: null,
    tipPosition: null,
    tipChildren: null,
    tipMode: null,
    isTipHovered: false,
    isHighlightHovered: false,
  };

  viewer!: PDFViewer;

  resizeObserver: ResizeObserver | null = null;
  containerNode?: HTMLDivElement | null = null;
  containerNodeRef: RefObject<HTMLDivElement>;
  highlightRoots: {
    [page: number]: { reactRoot: Root; container: Element };
  } = {};
  showTipTimeout: ReturnType<typeof setTimeout> | null = null;
  hideTipTimeout: ReturnType<typeof setTimeout> | null = null;
  flashTimeout: ReturnType<typeof setTimeout> | null = null;
  textLayerRenderedPages = new Set<number>();
  hasRenderedOnLoad = false;
  unsubscribe = () => { };

  constructor(props: Props<T_HT>) {
    super(props);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.debouncedScaleValue);
    }
    this.containerNodeRef = React.createRef();
  }

  componentDidMount() {
    this.init();
  }

  attachRef = (eventBus: EventBus) => {
    const { resizeObserver: observer } = this;
    this.containerNode = this.containerNodeRef.current;
    this.unsubscribe();

    if (this.containerNode) {
      const { ownerDocument: doc } = this.containerNode;
      eventBus.on("textlayerrendered", this.onTextLayerRenderedEvent);
      eventBus.on("pagesinit", this.onDocumentReady);
      doc.addEventListener("selectionchange", this.onSelectionChange);
      doc.addEventListener("mouseup", this.onMouseUp);
      doc.addEventListener("keydown", this.handleKeyDown);
      doc.defaultView?.addEventListener("resize", this.debouncedScaleValue);
      if (observer) observer.observe(this.containerNode);

      this.unsubscribe = () => {
        eventBus.off("pagesinit", this.onDocumentReady);
        eventBus.off("textlayerrendered", this.onTextLayerRenderedEvent);
        doc.removeEventListener("selectionchange", this.onSelectionChange);
        doc.removeEventListener("mouseup", this.onMouseUp);
        doc.removeEventListener("keydown", this.handleKeyDown);
        doc.defaultView?.removeEventListener(
          "resize",
          this.debouncedScaleValue,
        );
        if (observer) observer.disconnect();
      };
    }
  };

  componentDidUpdate(prevProps: Props<T_HT>) {
    if (prevProps.pdfDocument !== this.props.pdfDocument) {
      this.textLayerRenderedPages.clear();
      this.hasRenderedOnLoad = false;
      this.init();
      return;
    }
    if (prevProps.pdfScaleValue !== this.props.pdfScaleValue) {
      this.handleScaleValue();
    }
    if (prevProps.highlights !== this.props.highlights) {
      this.renderHighlightLayers();
    }
  }

  async init() {
    const { pdfDocument, pdfViewerOptions } = this.props;
    const pdfjs = await import("pdfjs-dist/web/pdf_viewer.mjs");

    const eventBus = new pdfjs.EventBus();
    const linkService = new pdfjs.PDFLinkService({
      eventBus,
      externalLinkTarget: 2,
    });

    if (!this.containerNodeRef.current) {
      throw new Error("!");
    }

    this.viewer =
      this.viewer ||
      new pdfjs.PDFViewer({
        container: this.containerNodeRef.current,
        eventBus: eventBus,
        // enhanceTextSelection: true, // deprecated. https://github.com/mozilla/pdf.js/issues/9943#issuecomment-409369485
        textLayerMode: 2,
        removePageBorders: true,
        linkService: linkService,
        ...pdfViewerOptions,
      });

    linkService.setDocument(pdfDocument);
    linkService.setViewer(this.viewer);
    this.viewer.setDocument(pdfDocument);

    this.attachRef(eventBus);
  }

  componentWillUnmount() {
    this.unsubscribe();
    if (this.showTipTimeout) {
      clearTimeout(this.showTipTimeout);
    }
    if (this.hideTipTimeout) {
      clearTimeout(this.hideTipTimeout);
    }
    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }
  }

  findOrCreateHighlightLayer(page: number) {
    const { textLayer } = this.viewer.getPageView(page - 1) || {};

    if (!textLayer) {
      return null;
    }

    const layer = findOrCreateContainerLayer(
      textLayer.div,
      `PdfHighlighter__highlight-layer ${styles.highlightLayer}`,
      ".PdfHighlighter__highlight-layer",
    );

    // Keep the highlight layer above text spans (PDF.js can re-append spans).
    if (textLayer.div.lastElementChild !== layer) {
      textLayer.div.appendChild(layer);
    }
    layer.style.zIndex = "5";

    return layer;
  }

  groupHighlightsByPage(highlights: Array<T_HT>): {
    [pageNumber: string]: Array<T_HT>;
  } {
    const { ghostHighlight } = this.state;

    const allHighlights = [...highlights, ghostHighlight].filter(
      Boolean,
    ) as T_HT[];

    const pageNumbers = new Set<number>();
    for (const highlight of allHighlights) {
      pageNumbers.add(highlight.position.pageNumber);
      for (const rect of highlight.position.rects) {
        if (rect.pageNumber) {
          pageNumbers.add(rect.pageNumber);
        }
      }
    }

    const groupedHighlights: Record<number, T_HT[]> = {};

    for (const pageNumber of pageNumbers) {
      groupedHighlights[pageNumber] = groupedHighlights[pageNumber] || [];
      for (const highlight of allHighlights) {
        const pageSpecificHighlight = {
          ...highlight,
          position: {
            pageNumber,
            boundingRect: highlight.position.boundingRect,
            rects: [],
            usePdfCoordinates: highlight.position.usePdfCoordinates,
          } as ScaledPosition,
        };
        let anyRectsOnPage = false;
        for (const rect of highlight.position.rects) {
          if (
            pageNumber === (rect.pageNumber || highlight.position.pageNumber)
          ) {
            pageSpecificHighlight.position.rects.push(rect);
            anyRectsOnPage = true;
          }
        }
        if (anyRectsOnPage || pageNumber === highlight.position.pageNumber) {
          groupedHighlights[pageNumber].push(pageSpecificHighlight);
        }
      }
    }

    return groupedHighlights;
  }

  showTip(highlight: T_ViewportHighlight<T_HT>, content: JSX.Element) {
    const { isCollapsed, ghostHighlight, isAreaSelectionInProgress } =
      this.state;

    const highlightInProgress = !isCollapsed || ghostHighlight;

    if (highlightInProgress || isAreaSelectionInProgress) {
      return;
    }

    this.setTip(highlight.position, content, "hover");
  }

  scaledPositionToViewport({
    pageNumber,
    boundingRect,
    rects,
    usePdfCoordinates,
  }: ScaledPosition): Position {
    const viewport = this.viewer.getPageView(pageNumber - 1).viewport;

    return {
      boundingRect: scaledToViewport(boundingRect, viewport, usePdfCoordinates),
      rects: (rects || []).map((rect) =>
        scaledToViewport(rect, viewport, usePdfCoordinates),
      ),
      pageNumber,
    };
  }

  viewportPositionToScaled({
    pageNumber,
    boundingRect,
    rects,
  }: Position): ScaledPosition {
    const viewport = this.viewer.getPageView(pageNumber - 1).viewport;

    return {
      boundingRect: viewportToScaled(boundingRect, viewport),
      rects: (rects || []).map((rect) => viewportToScaled(rect, viewport)),
      pageNumber,
    };
  }

  screenshot(position: LTWH, pageNumber: number) {
    const canvas = this.viewer.getPageView(pageNumber - 1).canvas;

    return getAreaAsPNG(canvas, position);
  }

  hideTipAndSelection = () => {
    // Clear any pending timers
    if (this.showTipTimeout) {
      clearTimeout(this.showTipTimeout);
      this.showTipTimeout = null;
    }
    if (this.hideTipTimeout) {
      clearTimeout(this.hideTipTimeout);
      this.hideTipTimeout = null;
    }

    this.setState({
      tipPosition: null,
      tipChildren: null,
      tipMode: null,
      isTipHovered: false,
      isHighlightHovered: false,
    });

    this.setState({ ghostHighlight: null, tip: null }, () =>
      this.renderHighlightLayers(),
    );
  };

  setTip(
    position: Position,
    inner: JSX.Element | null,
    mode: "hover" | "selection" = "hover",
  ) {
    this.setState({
      tipPosition: position,
      tipChildren: inner,
      tipMode: mode,
    });
  }

  onTipMouseEnter = () => {
    if (this.hideTipTimeout) {
      clearTimeout(this.hideTipTimeout);
      this.hideTipTimeout = null;
    }
    this.setState({ isTipHovered: true });
  };

  onTipMouseLeave = () => {
    this.setState({ isTipHovered: false });
    this.scheduleHideTip();
  };

  onHighlightMouseEnter = (
    highlight: T_ViewportHighlight<T_HT>,
    popupContent: JSX.Element,
  ) => {
    if (this.hideTipTimeout) {
      clearTimeout(this.hideTipTimeout);
      this.hideTipTimeout = null;
    }
    this.setState({ isHighlightHovered: true });

    // Clear any existing show timeout
    if (this.showTipTimeout) {
      clearTimeout(this.showTipTimeout);
    }

    // Show tip after 200ms delay
    this.showTipTimeout = setTimeout(() => {
      this.showTipTimeout = null;
      // Only show if still hovered
      if (this.state.isHighlightHovered || this.state.isTipHovered) {
        this.setTip(highlight.position, popupContent, "hover");
      }
    }, 200);
  };

  onHighlightMouseLeave = () => {
    // Clear show timeout if we leave before it fires
    if (this.showTipTimeout) {
      clearTimeout(this.showTipTimeout);
      this.showTipTimeout = null;
    }
    this.setState({ isHighlightHovered: false });
    this.scheduleHideTip();
  };

  scheduleHideTip = () => {
    if (this.state.tipMode !== "hover") {
      return;
    }
    if (this.hideTipTimeout) {
      clearTimeout(this.hideTipTimeout);
    }

    // Hide tip after 150ms delay (allows moving from highlight to tip)
    this.hideTipTimeout = setTimeout(() => {
      this.hideTipTimeout = null;
      // Only hide if neither highlight nor tip is hovered
      if (!this.state.isHighlightHovered && !this.state.isTipHovered) {
        this.setState({
          tipPosition: null,
          tipChildren: null,
          tipMode: null,
        });
      }
    }, 150);
  };

  renderTip = () => {
    const { tipPosition, tipChildren } = this.state;
    if (!tipPosition) return null;

    const { boundingRect, pageNumber } = tipPosition;
    const page = {
      node: this.viewer.getPageView((boundingRect.pageNumber || pageNumber) - 1)
        .div,
      pageNumber: boundingRect.pageNumber || pageNumber,
    };

    const pageBoundingRect = {
      bottom: page.node.offsetTop + page.node.offsetHeight,
      height: page.node.offsetHeight,
      left: page.node.offsetLeft,
      right: page.node.offsetLeft + page.node.offsetWidth,
      top: page.node.offsetTop,
      width: page.node.offsetWidth,
      x: page.node.offsetLeft,
      y: page.node.offsetTop,
      pageNumber: page.pageNumber,
    };

    // Position based on highlight's bounding rect (left edge, for centering calculation)
    const highlightLeft = page.node.offsetLeft + boundingRect.left;
    const highlightTop = boundingRect.top + page.node.offsetTop;

    return (
      <TipContainer
        scrollTop={this.viewer.container.scrollTop}
        pageBoundingRect={pageBoundingRect}
        style={{
          left: highlightLeft,
          top: highlightTop,
          bottom: highlightTop + boundingRect.height,
          highlightWidth: boundingRect.width,
        }}
        onMouseEnter={this.onTipMouseEnter}
        onMouseLeave={this.onTipMouseLeave}
      >
        {tipChildren}
      </TipContainer>
    );
  };

  onTextLayerRenderedEvent = (event: { pageNumber: number }) => {
    const { onTextLayerReady, forceRenderOnLoad = true } = this.props;
    const pageNumber = event?.pageNumber;
    if (pageNumber) {
      this.textLayerRenderedPages.add(pageNumber);
      onTextLayerReady?.(pageNumber);
    }

    this.renderHighlightLayers();

    if (
      forceRenderOnLoad &&
      !this.hasRenderedOnLoad &&
      this.textLayerRenderedPages.size === this.props.pdfDocument.numPages
    ) {
      this.hasRenderedOnLoad = true;
      this.renderHighlightLayers();
    }
  };

  scrollTo = (highlight: T_HT) => {
    const { pageNumber, boundingRect, usePdfCoordinates } = highlight.position;

    this.viewer.container.removeEventListener("scroll", this.onScroll);

    const pageViewport = this.viewer.getPageView(pageNumber - 1).viewport;
    const container = this.viewer.container;
    const pageView = this.viewer.getPageView(pageNumber - 1);
    const pageNode = pageView?.div;
    const viewportRect = scaledToViewport(
      boundingRect,
      pageViewport,
      usePdfCoordinates,
    );

    if (pageNode) {
      const targetTop =
        pageNode.offsetTop +
        viewportRect.top -
        (container.clientHeight - viewportRect.height) / 2;
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTop = Math.max(0, Math.min(maxScroll, targetTop));
    } else {
      this.viewer.scrollPageIntoView({
        pageNumber,
        destArray: [
          null,
          { name: "XYZ" },
          ...pageViewport.convertToPdfPoint(0, viewportRect.top),
          0,
        ],
      });
    }

    this.setState(
      {
        scrolledToHighlightId: highlight.id,
      },
      () => this.renderHighlightLayers(),
    );

    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }
    this.flashTimeout = setTimeout(() => {
      this.flashTimeout = null;
      this.setState({ scrolledToHighlightId: EMPTY_ID }, () =>
        this.renderHighlightLayers(),
      );
    }, 1000);

    // wait for scrolling to finish
    setTimeout(() => {
      this.viewer.container.addEventListener("scroll", this.onScroll);
    }, 100);
  };

  onDocumentReady = () => {
    const { scrollRef, onDocumentReady } = this.props;

    this.handleScaleValue();

    scrollRef(this.scrollTo);
    onDocumentReady?.();
  };

  onSelectionChange = () => {
    const container = this.containerNode;
    if (!container) {
      return;
    }

    const selection = getWindow(container).getSelection();
    if (!selection) {
      return;
    }

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    if (selection.isCollapsed) {
      this.setState({ isCollapsed: true });
      return;
    }

    if (
      !range ||
      !container ||
      !container.contains(range.commonAncestorContainer)
    ) {
      return;
    }

    this.setState({
      isCollapsed: false,
      range,
    });

    // Don't call afterSelection here - wait for mouseup
  };

  onMouseUp = () => {
    const { isCollapsed, range } = this.state;

    // Only process if we have a valid selection
    if (!isCollapsed && range) {
      // Small delay to ensure selection is finalized
      setTimeout(() => {
        this.afterSelection();
      }, 0);
    }
  };

  onScroll = () => {
    const { onScrollChange } = this.props;

    onScrollChange();

    this.setState(
      {
        scrolledToHighlightId: EMPTY_ID,
      },
      () => this.renderHighlightLayers(),
    );

    this.viewer.container.removeEventListener("scroll", this.onScroll);
  };

  onMouseDown: PointerEventHandler = (event) => {
    if (!(event.target instanceof Element) || !isHTMLElement(event.target)) {
      return;
    }

    // Don't hide if clicking inside the tip container
    if (event.target.closest("#PdfHighlighter__tip-container")) {
      return;
    }

    // Don't hide if clicking on a highlight (let hover handle it)
    if (event.target.closest(".Highlight")) {
      return;
    }

    this.hideTipAndSelection();
  };

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Escape") {
      this.hideTipAndSelection();
    }
  };

  afterSelection = () => {
    const { onSelectionFinished, onCreate } = this.props;

    const { isCollapsed, range } = this.state;

    if (!range || isCollapsed) {
      return;
    }

    const pages = getPagesFromRange(range);

    if (!pages || pages.length === 0) {
      return;
    }

    const rects = getClientRects(range, pages);

    if (rects.length === 0) {
      return;
    }

    const boundingRect = getBoundingRect(rects);

    const viewportPosition: Position = {
      boundingRect,
      rects,
      pageNumber: pages[0].number,
    };

    const content = {
      text: range.toString(),
    };
    const scaledPosition = this.viewportPositionToScaled(viewportPosition);

    if (!onSelectionFinished) {
      if (onCreate) {
        const payload: HighlightCreatePayload = {
          content,
          position: scaledPosition,
        };
        onCreate(payload);
      }
      this.hideTipAndSelection();
      return;
    }

    this.setTip(
      viewportPosition,
      onSelectionFinished(
        scaledPosition,
        content,
        () => this.hideTipAndSelection(),
        () => {
          // Clear browser selection to avoid double-yellow effect
          getWindow(this.containerNode!).getSelection()?.removeAllRanges();
          this.setState(
            {
              ghostHighlight: { position: scaledPosition },
            },
            () => this.renderHighlightLayers(),
          );
        },
      ),
      "selection",
    );
  };


  toggleTextSelection(flag: boolean) {
    if (!this.viewer.viewer) {
      return;
    }
    this.viewer.viewer.classList.toggle(styles.disableSelection, flag);
  }

  handleScaleValue = () => {
    if (this.viewer) {
      this.viewer.currentScaleValue = this.props.pdfScaleValue; //"page-width";
    }
  };

  debouncedScaleValue: () => void = debounce(this.handleScaleValue, 500);

  private defaultHighlightTransform = (
    highlight: T_ViewportHighlight<T_HT>,
    index: number,
    _setTip: (
      highlight: T_ViewportHighlight<T_HT>,
      callback: (highlight: T_ViewportHighlight<T_HT>) => JSX.Element,
    ) => void,
    _hideTip: () => void,
    viewportToScaled: (rect: LTWHP) => Scaled,
    screenshot: (position: LTWH) => string,
    isScrolledTo: boolean,
  ) => {
    const { onUpdate, renderPopup, onHighlightHover, onHighlightBlur, debug } =
      this.props;
    const isTextHighlight = !highlight.content?.image;
    const popupContent = renderPopup
      ? renderPopup(highlight)
      : highlight.comment
        ? <div className={styles.popup}>{highlight.comment}</div>
        : null;

    const handleMouseEnter = () => {
      if (debug) {
        console.log("[PdfHighlighter] hover enter", {
          id: highlight.id,
          pageNumber: highlight.position.pageNumber,
        });
      }
      onHighlightHover?.(highlight);
      if (popupContent) {
        this.onHighlightMouseEnter(highlight, popupContent);
      }
    };

    const handleMouseLeave = () => {
      if (debug) {
        console.log("[PdfHighlighter] hover leave", {
          id: highlight.id,
          pageNumber: highlight.position.pageNumber,
        });
      }
      onHighlightBlur?.(highlight);
      if (popupContent) {
        this.onHighlightMouseLeave();
      }
    };

    const component = isTextHighlight ? (
      <Highlight
        isScrolledTo={isScrolledTo}
        position={highlight.position}
        comment={highlight.comment}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    ) : (
      <AreaHighlight
        isScrolledTo={isScrolledTo}
        highlight={highlight}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onChange={(boundingRect) => {
          if (!onUpdate) {
            return;
          }

          const scaledBoundingRect = viewportToScaled(boundingRect);
          const scaledRects = highlight.position.rects.map((rect) =>
            viewportToScaled(rect),
          );

          onUpdate(String(highlight.id), {
            position: {
              boundingRect: scaledBoundingRect,
              rects: scaledRects,
              pageNumber: highlight.position.pageNumber,
            },
            content: { image: screenshot(boundingRect) },
          });
        }}
      />
    );

    return <React.Fragment key={index}>{component}</React.Fragment>;
  };

  render() {
    const { onSelectionFinished, enableAreaSelection } = this.props;

    return (
      <div onPointerDown={this.onMouseDown}>
        <div
          ref={this.containerNodeRef}
          className={styles.container}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="pdfViewer" />
          {this.renderTip()}
          {typeof enableAreaSelection === "function" ? (
            <MouseSelection
              onDragStart={() => this.toggleTextSelection(true)}
              onDragEnd={() => this.toggleTextSelection(false)}
              onChange={(isVisible) =>
                this.setState({ isAreaSelectionInProgress: isVisible })
              }
              shouldStart={(event) =>
                enableAreaSelection(event) &&
                event.target instanceof Element &&
                isHTMLElement(event.target) &&
                Boolean(event.target.closest(".page"))
              }
              onSelection={(startTarget, boundingRect, resetSelection) => {
                const page = getPageFromElement(startTarget);

                if (!page) {
                  return;
                }

                const pageBoundingRect = {
                  ...boundingRect,
                  top: boundingRect.top - page.node.offsetTop,
                  left: boundingRect.left - page.node.offsetLeft,
                  pageNumber: page.number,
                };

                const viewportPosition = {
                  boundingRect: pageBoundingRect,
                  rects: [],
                  pageNumber: page.number,
                };

                const scaledPosition =
                  this.viewportPositionToScaled(viewportPosition);

                const image = this.screenshot(
                  pageBoundingRect,
                  pageBoundingRect.pageNumber,
                );

                if (!onSelectionFinished) {
                  if (this.props.onCreate) {
                    const payload: HighlightCreatePayload = {
                      content: { image },
                      position: scaledPosition,
                    };
                    this.props.onCreate(payload);
                  }
                  resetSelection();
                  this.hideTipAndSelection();
                  return;
                }

                this.setTip(
                  viewportPosition,
                  onSelectionFinished(
                    scaledPosition,
                    { image },
                    () => this.hideTipAndSelection(),
                    () => {
                      console.log("setting ghost highlight", scaledPosition);
                      this.setState(
                        {
                          ghostHighlight: {
                            position: scaledPosition,
                            content: { image },
                          },
                        },
                        () => {
                          resetSelection();
                          this.renderHighlightLayers();
                        },
                      );
                    },
                  ),
                  "selection",
                );
              }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  private renderHighlightLayers() {
    const { pdfDocument } = this.props;
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const highlightRoot = this.highlightRoots[pageNumber];
      /** Need to check if container is still attached to the DOM as PDF.js can unload pages. */
      if (highlightRoot?.container.isConnected) {
        this.renderHighlightLayer(highlightRoot.reactRoot, pageNumber);
      } else {
        const highlightLayer = this.findOrCreateHighlightLayer(pageNumber);
        if (highlightLayer) {
          const reactRoot = createRoot(highlightLayer);
          this.highlightRoots[pageNumber] = {
            reactRoot,
            container: highlightLayer,
          };
          this.renderHighlightLayer(reactRoot, pageNumber);
        }
      }
    }
  }

  private renderHighlightLayer(root: Root, pageNumber: number) {
    const { highlights } = this.props;
    const highlightTransform =
      this.props.highlightTransform || this.defaultHighlightTransform;
    const { tip, scrolledToHighlightId } = this.state;
    root.render(
      <HighlightLayer
        highlightsByPage={this.groupHighlightsByPage(highlights)}
        pageNumber={pageNumber.toString()}
        scrolledToHighlightId={scrolledToHighlightId}
        highlightTransform={highlightTransform}
        tip={tip}
        scaledPositionToViewport={this.scaledPositionToViewport.bind(this)}
        hideTipAndSelection={this.hideTipAndSelection.bind(this)}
        viewer={this.viewer}
        screenshot={this.screenshot.bind(this)}
        showTip={this.showTip.bind(this)}
        setTip={(tip) => {
          this.setState({ tip });
        }}
      />,
    );
  }
}
