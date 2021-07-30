import ReactJson from "react-json-view";
import type * as T from "react-json-view";

export function JsonViewer(props: T.ReactJsonViewProps) {
  return (
    <ReactJson
      collapseStringsAfterLength={100}
      displayDataTypes={false}
      displayObjectSize={false}
      enableClipboard={false}
      quotesOnKeys={false}
      collapsed={2}
      {...props}
      style={{
        lineHeight: "1",
        fontSize: "16px",
        ...(props.style ? props.style : {}),
      }}
    />
  );
}
