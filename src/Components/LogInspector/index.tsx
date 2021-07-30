import { Button, message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "State";
import "./style.css";
import { JsonViewer } from "../JsonViewer";
import { Empty } from "antd";

let count: number = null;
export function LogModal() {
  const [visible, setVisible] = useState(false);
  const logs = useSelector((state) => state.logs.entries);

  const logCount = useSelector((state) => state.logs.count);

  useEffect(() => {
    if (count === null) {
      count = logCount;
      return;
    }

    const diff = logCount - count;
    if (diff <= 0) return;
    for (const log of logs.slice(count))
      message.info({
        content: `Server-side log created on route /${log.route}`,
        duration: 3,
        style: { position: "absolute", top: "5px", left: "20px" },
      });

    count = logCount;
  }, [logCount, logs]);

  return (
    <>
      <Button onClick={() => setVisible(!visible)}>Inspect Server Logs</Button>
      <Modal
        centered={true}
        footer={null}
        destroyOnClose={true}
        wrapClassName="log-modal-wrapper"
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(false)}
        visible={visible}
        width="90vw"
      >
        <LogInspector />
      </Modal>
    </>
  );
}

function LogInspector() {
  const entries = useSelector((state) => state.logs.entries);
  return (
    <div className="log-modal-body">
      {!entries.length && (
        <Empty className="empty-container" description="No logs" />
      )}

      {!!entries.length &&
        entries.map((log) => (
          <div className="log-modal-entry" key={`log-entry-${log.id}`}>
            <div>
              <div>{log.timestamp}</div>
              <div>/{log.route}</div>
            </div>
            <JsonViewer
              name={null}
              src={log.log}
              style={{ fontSize: "14px" }}
            />
          </div>
        ))}
    </div>
  );
}
