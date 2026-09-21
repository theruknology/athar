import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CloudPosture } from "../../api/types";
import { renderWithProviders } from "../../test/render";
import { CloudPosturePanel } from "./CloudPosturePanel";

function posture(over: Partial<CloudPosture> & Pick<CloudPosture, "cloud">): CloudPosture {
  return {
    status: "current",
    identities: 10,
    principals: 12,
    grants: 40,
    findings: 5,
    critical: 1,
    high: 2,
    privileged: 3,
    privileged_without_mfa: 1,
    privileged_grants: 4,
    last_grant_month: 12,
    last_grant_month_label: "August 2026",
    ...over,
  };
}

describe("CloudPosturePanel", () => {
  it("says a cloud has no data instead of rendering a reassuring row of zeros", () => {
    renderWithProviders(
      <CloudPosturePanel
        rows={[
          posture({ cloud: "aws" }),
          posture({
            cloud: "gcp",
            status: "absent",
            identities: 0,
            principals: 0,
            grants: 0,
            findings: 0,
            critical: 0,
            high: 0,
            privileged: 0,
            privileged_without_mfa: 0,
            privileged_grants: 0,
            last_grant_month: null,
            last_grant_month_label: null,
          }),
        ]}
      />,
      { route: "/" },
    );

    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText(/does not assume a provider is clean because it is missing/i)).toBeInTheDocument();
    // the empty cloud must not render a "0 critical" that reads like a pass
    expect(screen.queryByRole("link", { name: /Critical\s*0/ })).not.toBeInTheDocument();
  });

  it("flags a cloud whose export is older than the snapshot rather than calling it current", () => {
    renderWithProviders(
      <CloudPosturePanel rows={[posture({ cloud: "azure", status: "stale", last_grant_month_label: "July 2026" })]} />,
      { route: "/" },
    );

    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText(/newest July 2026/)).toBeInTheDocument();
  });

  it("links every number to the rows behind it", () => {
    renderWithProviders(<CloudPosturePanel rows={[posture({ cloud: "aws" })]} />, { route: "/" });

    expect(screen.getByRole("link", { name: /Identities\s*10/ })).toHaveAttribute(
      "href",
      "/identities?cloud=aws",
    );
    expect(screen.getByRole("link", { name: /Critical\s*1/ })).toHaveAttribute(
      "href",
      "/findings?cloud=aws&severity=Critical",
    );
    expect(screen.getByRole("link", { name: /No MFA\s*1/ })).toHaveAttribute(
      "href",
      "/findings?cloud=aws&rule=R9",
    );
  });
});
