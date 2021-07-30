import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Spin,
  Typography,
} from "antd";
import { isEqual, startCase } from "lodash";
import React, { useState } from "react";
import {
  fetchReservedNumber,
  removePost,
  updatePost,
  useDispatch,
  useSelector,
} from "State";
import { cleanObj, safeFn, to10DLC, toPrettyPhone } from "Utilities";
import { ListItem } from "../ListItem";
import "./style.css";

const { TextArea } = Input;

const { Paragraph } = Typography;

export function PostSection() {
  const dispatch = useDispatch();
  const postIds = useSelector((state) => Object.keys(state.posts.entities));
  const saved = useSelector(
    (state) => postIds.map((id) => state.posts.entities[id].isSaved),
    isEqual
  );
  const titles = useSelector((state) =>
    Object.values(state.posts.entities).map((post) => post.title)
  );

  return (
    <div>
      {postIds.map((id, idx) => (
        <ListItem
          key={`post-card-${id}`}
          edit={() => dispatch(updatePost({ id, isSaved: !saved[idx] }))}
          remove={() => dispatch(removePost(id))}
          title={startCase(titles[idx])}
        >
          {saved[idx] ? <PostCard id={id} /> : <NewPost id={id} />}
        </ListItem>
      ))}
    </div>
  );
}

function PostCard({ id }: { id: string }) {
  const dispatch = useDispatch();
  const post = useSelector((state) => state.posts.entities[id]);

  const [fetching, setFetching] = useState(false);

  const reserved = safeFn(toPrettyPhone, post.reservedNumber);

  return (
    <Card>
      <Descriptions
        colon={false}
        labelStyle={{ fontWeight: "bold" }}
        layout="vertical"
      >
        <Descriptions.Item label="Pet Owner Name">
          {post.petOwnerName}
        </Descriptions.Item>
        <Descriptions.Item label="Pet Owner Phone">
          <MaskedText text={safeFn(toPrettyPhone, post.petOwnerNumber)} />
        </Descriptions.Item>
        <Descriptions.Item label="Public Phone">
          {!post.reservedNumber && fetching && <Spin />}
          {!post.reservedNumber && !fetching && (
            <Button
              onClick={() =>
                dispatch(fetchReservedNumber(post)) && setFetching(true)
              }
            >
              See Number
            </Button>
          )}
          {reserved && (
            <Paragraph copyable={!!reserved && { text: post.reservedNumber }}>
              {reserved}
            </Paragraph>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Body">{post.body}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function MaskedText({ text }: { text: string }) {
  const [isVisible, setVisible] = useState(false);

  return (
    <div className="masked-text">
      {isVisible ? (
        <EyeOutlined onClick={() => setVisible(!isVisible)} />
      ) : (
        <EyeInvisibleOutlined onClick={() => setVisible(!isVisible)} />
      )}
      {isVisible ? <span>{text}</span> : null}
    </div>
  );
}

function NewPost({ id }: { id: string }) {
  const dispatch = useDispatch();
  const post = useSelector((state) => state.posts.entities[id]);

  return (
    <Card>
      <Form
        layout="vertical"
        onFinish={(data) =>
          dispatch(
            updatePost(
              cleanObj({
                ...data,
                id,
                isSaved: true,
                petOwnerNumber: to10DLC(data.petOwnerNumber),
              })
            )
          )
        }
      >
        <Form.Item initialValue={post.title} label="Title" name="title">
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={post.petOwnerName}
          label="Pet Owner Name"
          name="petOwnerName"
        >
          <Input />
        </Form.Item>
        <Form.Item
          initialValue={post.petOwnerNumber || null}
          label="Pet Owner Phone"
          name="petOwnerNumber"
        >
          <Input />
        </Form.Item>

        <Form.Item initialValue={post.body} label="Body" name="body">
          <TextArea />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form>
    </Card>
  );
}
