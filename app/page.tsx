'use client';

import { type Schema } from '@/amplify/data/resource';
import { useAIConversation } from '@/app/client';
import { AuthUser, fetchAuthSession } from '@aws-amplify/auth';
import {
  Alert,
  AlertVariations,
  Button,
  Flex,
  Tabs,
  View,
  withAuthenticator,
  WithAuthenticatorProps,
} from '@aws-amplify/ui-react';
import { AIConversation } from '@aws-amplify/ui-react-ai';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/data';
import { useCallback, useState } from 'react';

const client = generateClient<Schema>();

const ChatTab = () => {
  const [
    {
      data: { messages },
      isLoading,
      hasError,
    },
    handleSendMessage,
  ] = useAIConversation('chat');

  return (
    <AIConversation
      messages={messages}
      isLoading={isLoading && !hasError}
      handleSendMessage={handleSendMessage}
    />
  );
};

const StorageUploadTab = ({ user }: { user?: AuthUser }) => {
  const [creatingState, setCreatingState] = useState<AlertVariations>();

  const handleMakeKnowledge = useCallback(async ({ key }: { key?: string }) => {
    if (!key) {
      return;
    }

    setCreatingState('info');
    const session = await fetchAuthSession();
    const result = await client.queries.createKnowledge({
      identityID: session.identityId,
      accessLevel: 'protected',
      uploadedKey: key,
    });

    if (!result.data) {
      setCreatingState('error');
      return;
    }

    setCreatingState('success');
  }, []);

  const getAlertMessage = () => {
    switch (creatingState) {
      case 'info':
        return '情報を整理中です...';
      case 'error':
        return 'エラーが発生しました';
      case 'success':
        return '情報の整理が完了しました';
      default:
        return '';
    }
  };

  return (
    <Flex direction='column' rowGap='l'>
      <Alert variation={creatingState}>{getAlertMessage()}</Alert>
      <StorageManager
        acceptedFileTypes={['image/*', 'application/pdf']}
        accessLevel='protected'
        onUploadSuccess={handleMakeKnowledge}
        maxFileCount={1}
      />
    </Flex>
  );
};

const App = ({ signOut, user }: WithAuthenticatorProps) => {
  const { StorageBrowser } = createStorageBrowser({
    config: createAmplifyAuthAdapter(),
  });

  return (
    <Flex justifyContent='center' alignItems='center'>
      <Flex
        direction='column'
        rowGap='l'
        flex={1}
        width='100%'
        maxWidth='1280px'
      >
        <Flex direction='row' rowGap='l'>
          <View flex={1} textAlign='center'>
            <h1>Personal RAG Chat System</h1>
          </View>
          <Flex justifyContent='center' alignItems='center'>
            <Button
              size='small'
              variation='primary'
              colorTheme='info'
              onClick={signOut}
            >
              Sign out
            </Button>
          </Flex>
        </Flex>

        <Flex direction='row' rowGap='xxl'>
          <Tabs.Container defaultValue='1' flex={1}>
            <Tabs.List spacing='equal'>
              <Tabs.Item value='1'>チャット</Tabs.Item>
              <Tabs.Item value='2'>アップロード</Tabs.Item>
              <Tabs.Item value='3'>ストレージ</Tabs.Item>
            </Tabs.List>
            <Tabs.Panel value='1'>
              <ChatTab />
            </Tabs.Panel>
            <Tabs.Panel value='2'>
              <StorageUploadTab user={user} />
            </Tabs.Panel>
            <Tabs.Panel value='3'>
              <StorageBrowser />
            </Tabs.Panel>
          </Tabs.Container>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withAuthenticator(App);
