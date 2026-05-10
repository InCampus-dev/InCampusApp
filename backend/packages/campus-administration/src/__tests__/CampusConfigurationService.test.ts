import { describe, expect, it } from "vitest";

import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import { CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { Campus } from "../entities/Campus";
import { CampusStructuredOption } from "../entities/CampusStructuredOption";
import { CampusAuthorizationService } from "../services/CampusAuthorizationService";
import { CampusConfigurationService } from "../services/CampusConfigurationService";

describe("CampusConfigurationService", () => {
  it("creates a campus with initial structured options in one operation", async () => {
    const store = createCampusConfigurationStore();
    const service = new CampusConfigurationService(
      createCampusConfigurationDataSource(store),
      new CampusAuthorizationService()
    );

    const result = await service.createCampus(createAdminContext(), {
      universityName: "Tongji University",
      campusName: "Jiading Campus",
      activationStatus: true,
      initialStructuredOptions: [
        {
          optionType: CampusStructuredOptionType.ActivityCategory,
          name: "Lunch",
          description: "Low-pressure campus lunches"
        },
        {
          optionType: CampusStructuredOptionType.CampusLocation,
          name: "Jiading Library",
          description: "Shared meeting point"
        }
      ]
    });

    expect(result.campusId).toBe("9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81");
    expect(result.structuredOptions).toHaveLength(2);
    expect(store.campuses).toHaveLength(1);
    expect(store.structuredOptions).toHaveLength(2);
    expect(store.structuredOptions.map((option) => option.optionType)).toEqual([
      CampusStructuredOptionType.ActivityCategory,
      CampusStructuredOptionType.CampusLocation
    ]);
  });

  it("rejects campusId mismatches against selectedCampusId", async () => {
    const store = createCampusConfigurationStore();
    const service = new CampusConfigurationService(
      createCampusConfigurationDataSource(store),
      new CampusAuthorizationService()
    );

    await expect(
      service.createCampus(createAdminContext(), {
        campusId: "f9b8aa61-6b5c-47ca-a9e4-c130cab6c7b1",
        universityName: "Tongji University",
        campusName: "Jiading Campus"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects unauthorized selected campus access", async () => {
    const store = createCampusConfigurationStore();
    const service = new CampusConfigurationService(
      createCampusConfigurationDataSource(store),
      new CampusAuthorizationService()
    );

    await expect(
      service.createCampus(
        createAdminContext({
          selectedCampusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
          authorizedCampusIds: ["f2f89379-17e8-4b1a-9ad0-162d5b5d8fba"]
        }),
        {
          universityName: "Tongji University",
          campusName: "Jiading Campus"
        }
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });
});

function createAdminContext(
  overrides: Partial<AuthenticatedAdminContext> = {}
): AuthenticatedAdminContext {
  return {
    adminId: "admin-001",
    email: "admin@incampus.test",
    role: "campus_admin",
    selectedCampusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
    authorizedCampusIds: ["9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81"],
    ...overrides
  };
}

function createCampusConfigurationStore(): {
  campuses: Campus[];
  structuredOptions: CampusStructuredOption[];
} {
  return {
    campuses: [],
    structuredOptions: []
  };
}

function createCampusConfigurationDataSource(store: {
  campuses: Campus[];
  structuredOptions: CampusStructuredOption[];
}) {
  let optionCounter = 0;

  return {
    transaction: async <T>(work: (manager: { getRepository(entity: typeof Campus | typeof CampusStructuredOption): any }) => Promise<T>): Promise<T> =>
      await work({
        getRepository(entity: typeof Campus | typeof CampusStructuredOption) {
          if (entity === Campus) {
            return {
              async findOne({ where }: { where: { campusId: string } }) {
                return store.campuses.find((campus) => campus.campusId === where.campusId) ?? null;
              },
              create(payload: Partial<Campus>) {
                return { ...payload } as Campus;
              },
              async save(campus: Campus) {
                store.campuses.push(campus);
                return campus;
              }
            };
          }

          return {
            create(payload: Partial<CampusStructuredOption>) {
              const timestamp = new Date(`2026-05-10T00:00:0${optionCounter}Z`);

              return {
                optionId: `00000000-0000-4000-8000-${String(optionCounter + 1).padStart(12, "0")}`,
                createdAt: timestamp,
                updatedAt: timestamp,
                ...payload
              } as CampusStructuredOption;
            },
            async save(options: CampusStructuredOption[]) {
              optionCounter += options.length;
              store.structuredOptions.push(...options);
              return options;
            }
          };
        }
      })
  };
}
