import { Flex, Spin } from 'antd';

export default function Loading() {
  return (
    <Flex justify="center" style={{ padding: 48 }}>
      <Spin size="large" />
    </Flex>
  );
}
