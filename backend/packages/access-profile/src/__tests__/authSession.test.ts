import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import {
  PlatformAccessStatus,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { buildAuthenticatedResponse } from "../services/authSession";

describe("buildAuthenticatedResponse", () => {
  it("returns only public auth fields and signs a token with the selected campus", () => {
    const response = buildAuthenticatedResponse({
      studentAccountId: "student-001",
      universityEmail: "student@tongji.edu.cn",
      selectedCampusId: "campus-001",
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    });

    expect(Object.keys(response).sort()).toEqual([
      "accessToken",
      "platformAccessStatus",
      "selectedCampusId",
      "studentAccountId",
      "verificationStatus"
    ]);
    expect(response).toMatchObject({
      studentAccountId: "student-001",
      selectedCampusId: "campus-001",
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    });

    const payload = jwt.verify(
      response.accessToken,
      process.env.JWT_SECRET ?? "inCampus-mvp-dev-secret"
    ) as {
      sub: string;
      email: string;
      campusId: string | null;
      platformAccessStatus: PlatformAccessStatus;
      verificationStatus: VerificationStatus;
    };

    expect(payload).toMatchObject({
      sub: "student-001",
      email: "student@tongji.edu.cn",
      campusId: "campus-001",
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    });
  });
});
