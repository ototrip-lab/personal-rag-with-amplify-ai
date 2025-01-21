import { fetchAuthSession } from "@aws-amplify/auth";
import { Alert, AlertVariations, Flex } from "@aws-amplify/ui-react";
import { StorageManager } from "@aws-amplify/ui-react-storage";
import {
	createAmplifyAuthAdapter,
	createStorageBrowser,
} from "@aws-amplify/ui-react-storage/browser";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import { useCallback, useState } from "react";

import { type Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

const AlertMessage: { [key in AlertVariations]?: string } = {
	info: "Gathering information...",
	error: "An error has occurred",
	success: "Information organization is complete",
};

export const StorageTab = () => {
	const { StorageBrowser } = createStorageBrowser({
		config: createAmplifyAuthAdapter(),
	});
	const [creatingState, setCreatingState] = useState<AlertVariations>();

	const handleMakeKnowledge = useCallback(async ({ key }: { key?: string }) => {
		if (!key) {
			return;
		}

		setCreatingState("info");
		const session = await fetchAuthSession();
		const result = await client.queries.createKnowledge({
			identityID: session.identityId,
			accessLevel: "protected",
			uploadedKey: key,
		});

		if (!result.data) {
			setCreatingState("error");
			return;
		}

		setCreatingState("success");
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
			<StorageBrowser />
		</Flex>
	);
};
