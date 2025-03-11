import { fetchAuthSession } from "@aws-amplify/auth";
import {
  Alert,
  AlertVariations,
  Button,
  Flex,
  Text,
} from "@aws-amplify/ui-react";
import { StorageManager } from "@aws-amplify/ui-react-storage";
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from "@aws-amplify/ui-react-storage/browser";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import { useCallback, useEffect, useState } from "react";

import { type Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const AlertMessage: { [key in AlertVariations]?: string } = {
  info: "Gathering information...",
  error: "An error has occurred",
  success: "Information organization is complete",
};

const { StorageBrowser, useView } = createStorageBrowser({
  config: createAmplifyAuthAdapter(),
});

const CustomLocationsView = ({ identityID }: { identityID: string }) => {
  const state = useView("Locations");

  return (
    <Flex direction="column" padding="medium">
      <Text fontWeight="bold">Locations</Text>
      {state.pageItems.map((location) => {
        if (!location.prefix.includes(identityID)) return null;

        return (
          <Button
            key={location.id}
            justifyContent="flex-start"
            onClick={() => {
              state.onNavigate(location);
            }}
          >
            <Text flex="1">
              {location.prefix.replace(`${identityID}/`, "")}
            </Text>
            <Text as="span" color="font.tertiary" fontWeight="normal">
              {location.permissions.includes("list") ? "Read" : null}
              {" / "}
              {location.permissions.includes("write") ? "Write" : null}
            </Text>
          </Button>
        );
      })}
    </Flex>
  );
};

const MyStorageBrowser = ({ identityID }: { identityID: string }) => {
  const state = useView("LocationDetail");

  if (!state.location.current) {
    return <CustomLocationsView identityID={identityID} />;
  }
  return <StorageBrowser.LocationDetailView />;
};

export const StorageTab = () => {
  const [creatingState, setCreatingState] = useState<AlertVariations>();
  const [identityID, setIdentityID] = useState<string>("");

  const handleMakeKnowledge = useCallback(
    async ({ key }: { key?: string }) => {
      if (!key) {
        return;
      }

      setCreatingState("info");
      const result = await client.queries.createKnowledge({
        identityID,
        accessLevel: "private",
        uploadedKey: key,
      });

      if (!result.data) {
        setCreatingState("error");
        return;
      }

      setCreatingState("success");
    },
    [identityID],
  );

  useEffect(() => {
    const fetchIdentityId = async () => {
      const session = await fetchAuthSession();
      setIdentityID(session.identityId || "");
    };
    fetchIdentityId();
  }, []);

  return (
    <Flex direction="column" rowGap="l">
      <Alert variation={creatingState}>
        {creatingState && AlertMessage[creatingState]}
      </Alert>
      <StorageManager
        acceptedFileTypes={["application/pdf"]}
        accessLevel="private"
        onUploadSuccess={handleMakeKnowledge}
        maxFileCount={1}
      />
      <StorageBrowser.Provider
        displayText={{
          LocationsView: {
            title: "Knowledge",
          },
          LocationDetailView: {
            getTitle: (location) => location.key.replace(`${identityID}/`, ""),
          },
        }}
      >
        <MyStorageBrowser identityID={identityID} />
      </StorageBrowser.Provider>
    </Flex>
  );
};
