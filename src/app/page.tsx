"use client";

import {
  Button,
  Flex,
  Tabs,
  View,
  withAuthenticator,
  WithAuthenticatorProps,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { ChatTab, KnowledgeTab, StorageTab } from "./_tabs";

const App = ({ signOut, user }: WithAuthenticatorProps) => {
  return (
    <Flex justifyContent="center" alignItems="center">
      <Flex
        direction="column"
        rowGap="l"
        flex={1}
        width="100%"
        maxWidth="1280px"
      >
        <Flex direction="row" rowGap="l">
          <View flex={1} textAlign="center">
            <h1>Personal RAG Chat</h1>
          </View>
          <Flex justifyContent="center" alignItems="center">
            <Button size="small" variation="menu" onClick={signOut}>
              Sign out
            </Button>
          </Flex>
        </Flex>

        <Flex direction="row" rowGap="xxl">
          <Tabs.Container defaultValue="1" flex={1}>
            <Tabs.List spacing="equal">
              <Tabs.Item value="1">Chat</Tabs.Item>
              <Tabs.Item value="2">Storage</Tabs.Item>
              <Tabs.Item value="3">Knowledge</Tabs.Item>
            </Tabs.List>
            <Tabs.Panel value="1">
              <ChatTab user={user} />
            </Tabs.Panel>
            <Tabs.Panel value="2">
              <StorageTab />
            </Tabs.Panel>
            <Tabs.Panel value="3">
              <KnowledgeTab user={user} />
            </Tabs.Panel>
          </Tabs.Container>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withAuthenticator(App);
