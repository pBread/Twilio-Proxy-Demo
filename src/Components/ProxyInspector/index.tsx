import { Button, Modal, Spin, Tabs } from "antd";
import React, { useEffect, useState } from "react";
import { makeUrl } from "Utilities";
import { JsonViewer } from "../JsonViewer";
import "./style.css";
import type { ApiResult } from "./types";

const { TabPane } = Tabs;

export function ProxyModal() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible(!visible)}>Inspect Proxy</Button>
      <Modal
        centered={true}
        footer={null}
        destroyOnClose={true}
        wrapClassName="modal-wrapper"
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(false)}
        visible={visible}
        width="90vw"
      >
        <ProxyInspector />
      </Modal>
    </>
  );
}

function ProxyInspector() {
  const _data = useProxyData();
  const data = _data && structureData(_data);

  return (
    <div className="modal-body">
      {!data && <Spin className="spinner" size="large" />}
      {data && (
        <Tabs
          className=""
          tabBarStyle={{
            background: "white",
            position: "absolute",
            top: 0,
            width: "90%",
            zIndex: 1000,
          }}
        >
          <TabPane tab="All Proxy Data" key="all-proxy">
            <div style={{ marginTop: "50px" }}>
              <JsonViewer name="proxy" src={data} />
            </div>
          </TabPane>

          <TabPane tab="Services" key="services">
            <div style={{ marginTop: "50px" }}>
              <JsonViewer name="services" src={data.services} />
            </div>
          </TabPane>

          <TabPane tab="Sessions" key="sessions">
            <div style={{ marginTop: "50px" }}>
              <JsonViewer name="sessions" src={data.sessions} />
            </div>
          </TabPane>

          <TabPane tab="Participants" key="participants">
            <div style={{ marginTop: "50px" }}>
              <JsonViewer name="participants" src={data.participants} />
            </div>
          </TabPane>

          <TabPane tab="Phone Numbers" key="phones">
            <div style={{ marginTop: "50px" }}>
              <JsonViewer name="phoneNumbers" src={data.phoneNumbers} />
            </div>
          </TabPane>
        </Tabs>
      )}
    </div>
  );
}

function useProxyData() {
  const [data, setData] = useState<ApiResult>(null);

  useEffect(() => {
    async function main() {
      const data = await fetch(makeUrl("app/proxy-data")).then((res) =>
        res.json()
      );

      setData(data as ApiResult);
    }
    main();
  }, []);

  return !data ? null : data;
}

function structureData(data: ApiResult) {
  const sessions = data.sessions.map((session) => ({
    ...session,
    participants: data.participants.filter(
      (item) => item.sessionSid === session.sid
    ),
    interactions: data.interactions.filter(
      (item) => item.sessionSid === session.sid
    ),
  }));

  const services = data.services.map((svc) => ({
    ...svc,
    sessions: sessions.filter((item) => item.serviceSid === svc.sid),
    phoneNumbers: data.phoneNumbers.filter(
      (phone) => phone.serviceSid === svc.sid
    ),
  }));

  return {
    services,
    sessions,
    participants: data.participants,
    phoneNumbers: data.phoneNumbers,
  };
}
