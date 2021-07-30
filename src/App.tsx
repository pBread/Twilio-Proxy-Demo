import React from "react";
import "./App.css";
import { DialpadSection, Header, PostSection } from "./Components";
import { useInitApp } from "./State";

export default function App() {
  useInitApp();

  return (
    <div>
      <Header />
      <div className="app-body">
        <div>
          <PostSection />
        </div>
        <div>
          <DialpadSection />
        </div>
      </div>
    </div>
  );
}
