import { Component } from "react";
import styles from "../style/Tip.module.css";

interface State {
  compact: boolean;
  text: string;
}

interface Props {
  onConfirm: (comment: string) => void;
  onOpen: () => void;
  onUpdate?: () => void;
}

export class Tip extends Component<Props, State> {
  state: State = {
    compact: true,
    text: "",
  };

  // for TipContainer
  componentDidUpdate(_: Props, nextState: State) {
    const { onUpdate } = this.props;

    if (onUpdate && this.state.compact !== nextState.compact) {
      onUpdate();
    }
  }

  render() {
    const { onConfirm, onOpen } = this.props;
    const { compact, text } = this.state;

    return (
      <div>
        {compact ? (
          <div
            className={styles.compact}
            onClick={() => {
              onOpen();
              this.setState({ compact: false });
            }}
          >
            Add highlight
          </div>
        ) : (
          <form
            className={styles.card}
            onSubmit={(event) => {
              event.preventDefault();
              onConfirm(text);
            }}
          >
            <div>
              <textarea
                placeholder="Your comment"
                // biome-ignore lint/a11y/noAutofocus: This is an example app
                autoFocus
                value={text}
                onChange={(event) =>
                  this.setState({ text: event.target.value })
                }
                ref={(node) => {
                  if (node) {
                    node.focus();
                  }
                }}
              />
            </div>
            <div>
              <input type="submit" value="Save" />
            </div>
          </form>
        )}
      </div>
    );
  }
}
