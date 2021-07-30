import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Popconfirm } from "antd";
import type { ReactChild } from "react";
import React, { useState } from "react";
import "./style.css";

export function ListItem({
  children,
  edit,
  remove,
  title,
}: {
  children: ReactChild;
  edit?: () => void;
  remove?: () => void;
  title: string;
}) {
  const [visible, setVisible] = useState(true);

  return (
    <div className="list-item">
      <div className="list-item-toggle">
        {visible ? (
          <EyeOutlined onClick={() => setVisible(!visible)} />
        ) : (
          <EyeInvisibleOutlined onClick={() => setVisible(!visible)} />
        )}
      </div>
      <div className="list-item-title">{title}</div>

      {visible && (
        <div className="list-item-actions">
          {edit && <EditOutlined onClick={edit} />}

          {remove && (
            <Popconfirm onConfirm={remove} title="Delete?">
              <DeleteOutlined style={{ color: "red" }} />
            </Popconfirm>
          )}
        </div>
      )}

      {visible && <div className="list-item-body">{children}</div>}
    </div>
  );
}
