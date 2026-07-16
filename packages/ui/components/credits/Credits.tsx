"use client";

import { CALCOM_VERSION, COMPANY_NAME, IS_SELF_HOSTED } from "@calcom/lib/constants";
import Link from "next/link";
import { useEffect, useState } from "react";

const REPO_URL = "https://github.com/nouveauxterritoires/cal.nt";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const vercelCommitHash = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
const commitHash = vercelCommitHash ? `-${vercelCommitHash.slice(0, 7)}` : "";
const CalComVersion = `v.${CALCOM_VERSION}-${!IS_SELF_HOSTED ? "h" : "sh"}`;

export default function Credits() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <small className="text-default mx-3 mb-2 mt-1 hidden text-[0.5rem] opacity-50 lg:block">
      <Link href={REPO_URL} target="_blank" className="hover:underline">
        {COMPANY_NAME}
      </Link>{" "}
      {hasMounted && (
        <>
          <Link href={`${REPO_URL}/releases`} target="_blank" className="hover:underline">
            {CalComVersion}
          </Link>
          {vercelCommitHash ? (
            <Link href={`${REPO_URL}/commit/${vercelCommitHash}`} target="_blank" className="hover:underline">
              {commitHash}
            </Link>
          ) : (
            commitHash
          )}
        </>
      )}
    </small>
  );
}
