import { UndoOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { createDialpad, createPost } from "State";
import { makeUrl } from "Utilities";
import { LogModal } from "../LogInspector";
import { ProxyModal } from "../ProxyInspector";
import logo from "./logo.png";
import "./style.css";

export function Header() {
  const dispatch = useDispatch();

  return (
    <div className="app-header">
      <a className="logo" href="/" rel="noreferrer">
        <img alt="" src={logo} />
      </a>
      <div>
        <LogModal />
        <ProxyModal />

        <Button onClick={() => dispatch(createPost())} type="text">
          New Post
        </Button>
        <Button onClick={() => dispatch(createDialpad({}))} type="text">
          New Dialpad
        </Button>

        <Popconfirm onConfirm={resetOrg} title="Reset your Twilio org?">
          <Button
            danger
            icon={<UndoOutlined style={{ transform: "rotate(90deg)" }} />}
            type="text"
          >
            Reset Org
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
}

async function resetOrg() {
  localStorage.setItem("state", "");
  await fetch(makeUrl("app/reset"));
  window.location.href = `${window.location.href}`;
}
