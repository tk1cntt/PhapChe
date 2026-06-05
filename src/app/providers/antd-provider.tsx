"use client";

import React from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { ConfigProvider, App, type ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#0F766E",
    colorError: "#DC2626",
    colorBgLayout: "#F8FAFC",
    colorBgContainer: "#FFFFFF",
    colorBgElevated: "#FFFFFF",
    colorText: "#0F172A",
    colorTextSecondary: "#475569",
    colorBorder: "#E2E8F0",
    colorFillTertiary: "#F1F5F9",
    colorWhite: "#FFFFFF",
    fontSize: 14,
    borderRadius: 16,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    wireframe: false,
  },
  components: {
    Menu: {
      colorItemBgSelected: "#F0FDFA",
      colorItemTextSelected: "#0F766E",
      colorItemBgHover: "#F1F5F9",
      colorItemTextHover: "#0F172A",
      colorItemBg: "transparent",
      colorItemText: "#475569",
      borderRadius: 12,
      itemMarginInline: 8,
      itemMarginBlock: 4,
    },
    Button: {
      borderRadius: 12,
      controlHeight: 40,
      primaryColor: "#FFFFFF",
      defaultBorderColor: "#CBD5E1",
      defaultColor: "#0F172A",
      defaultBg: "#FFFFFF",
      colorPrimaryHover: "#115E59",
      colorPrimaryActive: "#134E4A",
    },
    Card: {
      padding: 16,
      paddingLG: 24,
      borderRadius: 16,
      colorBorderSecondary: "#E2E8F0",
    },
    Table: {
      borderRadius: 16,
      colorBgContainer: "#FFFFFF",
      headerBg: "#F8FAFC",
      headerColor: "#64748B",
      headerSortActiveBg: "#F1F5F9",
      rowHoverBg: "#F8FAFC",
      borderColor: "#E2E8F0",
    },
    Tag: {
      borderRadius: 9999,
    },
    Modal: {
      borderRadius: 16,
      borderRadiusLG: 16,
    },
  },
};

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyleProvider>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
