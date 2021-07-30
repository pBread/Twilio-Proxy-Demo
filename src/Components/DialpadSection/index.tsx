import { SendOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Select, Tag, Typography } from "antd";
import { isEqual } from "lodash";
import React, { useState } from "react";
import {
  evalIn,
  evalOut,
  getApiPhones,
  removeDialpad,
  setSms,
  SMS,
  updateDialpad,
  useDispatch,
  useSelector,
} from "State";
import { cleanObj, makeUrl, toPrettyPhone } from "Utilities";
import { v4 } from "uuid";
import { ListItem } from "../ListItem";
import "./style.css";

const { Title } = Typography;

export function DialpadSection() {
  const dispatch = useDispatch();

  const postIds = useSelector((state) => Object.keys(state.messages.dialpad));
  const saved = useSelector(
    (state) => postIds.map((id) => state.messages.dialpad[id].isSaved),
    isEqual
  );
  const titles = useSelector(
    (state) => postIds.map((id) => state.messages.dialpad[id].name),
    isEqual
  );

  return (
    <div>
      {postIds.map((id, idx) => (
        <ListItem
          key={`post-card-${id}`}
          edit={() => dispatch(updateDialpad({ id, isSaved: !saved[idx] }))}
          remove={() => dispatch(removeDialpad(id))}
          title={titles[idx]}
        >
          {saved[idx] ? <DialpadComp id={id} /> : <NewDialpad id={id} />}
        </ListItem>
      ))}
    </div>
  );
}

function DialpadComp({ id }: { id: string }) {
  const dialpad = useSelector((state) => state.messages.dialpad[id]);
  const [body, setBody] = useState("");

  const messages = useSelector(
    (state) =>
      Object.values(state.messages.sms)
        .filter((sms) => evalIn(dialpad, sms) || evalOut(dialpad, sms))
        .map((sms) => sms.sid),
    isEqual
  );

  const dispatch = useDispatch();
  async function send() {
    const sms = {
      body,
      direction: "outbound",
      sid: v4(),
      from: dialpad.from,
      status: "pending",
      to: dialpad.to,
    } as SMS;
    dispatch(setSms(sms));
    setBody("");
    await fetch(makeUrl("app/send-sms", sms));
    dispatch(setSms({ ...sms, status: "sent" }));
  }

  return (
    <Card
      extra={<div className="pad-header">{toPrettyPhone(dialpad.from)}</div>}
      title={<div className="pad-header">{toPrettyPhone(dialpad.to)}</div>}
    >
      <div className="sms-list">
        {messages.map((sid: string) => (
          <SMSMessage key={`sms-${sid}-${id}`} dialpadId={id} sid={sid} />
        ))}
      </div>
      <div className="text-enter-wrapper">
        <Input
          addonAfter={
            <SendOutlined className="icon-send" onClick={send} rotate={270} />
          }
          onChange={(ev) => setBody(ev.target.value)}
          value={body}
        />
      </div>
    </Card>
  );
}

function SMSMessage({ dialpadId, sid }: { dialpadId: string; sid: string }) {
  const body = useSelector((state) => state.messages.sms[sid].body);
  const isInbound = useSelector((state) =>
    evalIn(state.messages.dialpad[dialpadId], state.messages.sms[sid])
  );

  return (
    <div
      className={`sms-wrapper sms-wrapper-${
        isInbound ? "inbound" : "outbound"
      }`}
    >
      <Tag
        className={`sms-message sms-message-${
          isInbound ? "inbound" : "outbound"
        }`}
        color={!isInbound && "cyan"}
      >
        {body}
      </Tag>
    </div>
  );
}

function NewDialpad({ id }: { id: string }) {
  const dispatch = useDispatch();
  const dialpad = useSelector((state) => state.messages.dialpad[id]);
  const phones = useSelector(getApiPhones);

  return (
    <Card>
      <Form
        layout="vertical"
        onFinish={(data) =>
          dispatch(updateDialpad(cleanObj({ ...data, id, isSaved: true })))
        }
      >
        <Form.Item
          initialValue={dialpad.name}
          label="Friendly Name"
          name="name"
        >
          <Input />
        </Form.Item>
        <Form.Item initialValue={dialpad.from || null} label="From" name="from">
          <Select>
            {phones.map((phone) => (
              <Select.Option key={`phone-${id}-${phone}`} value={phone}>
                {phone}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item initialValue={dialpad.to} label="To" name="to">
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form>
    </Card>
  );
}
