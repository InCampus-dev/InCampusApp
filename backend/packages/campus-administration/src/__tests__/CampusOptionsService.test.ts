import { describe, expect, it } from "vitest";

import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import { CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { Campus } from "../entities/Campus";
import { CampusStructuredOption } from "../entities/CampusStructuredOption";
import { CampusAuthorizationService } from "../services/CampusAuthorizationService";
import { CampusOptionsService } from "../services/CampusOptionsService";

describe("CampusOptionsService", () => {
  it("lists campus-scoped structured options and filters by optionType", async () => {
    const context = createAdminContext();
    const store = createCampusOptionsStore();
    const service = createCampusOptionsService(store);

    const allSelectableOptions = await service.listStructuredOptions(context, context.selectedCampusId, {});
    const categoryOptions = await service.listStructuredOptions(context, context.selectedCampusId, {
      optionType: CampusStructuredOptionType.ActivityCategory
    });

    expect(allSelectableOptions).toHaveLength(2);
    expect(allSelectableOptions.every((option) => option.isActive)).toBe(true);
    expect(categoryOptions).toHaveLength(1);
    expect(categoryOptions[0]?.optionType).toBe(CampusStructuredOptionType.ActivityCategory);
  });

  it("returns inactive options only when includeInactive is true", async () => {
    const context = createAdminContext();
    const store = createCampusOptionsStore();
    const service = createCampusOptionsService(store);

    const options = await service.listStructuredOptions(context, context.selectedCampusId, {
      includeInactive: "true"
    });

    expect(options).toHaveLength(3);
    expect(options.some((option) => option.isActive === false)).toBe(true);
  });

  it("creates, updates, and deactivates a structured option", async () => {
    const context = createAdminContext();
    const store = createCampusOptionsStore();
    const service = createCampusOptionsService(store);

    const createdOption = await service.createStructuredOption(context, context.selectedCampusId, {
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Campus Cafeteria",
      description: "Main cafeteria",
      isActive: true
    });

    const updatedOption = await service.updateStructuredOption(
      context,
      context.selectedCampusId,
      createdOption.optionId,
      {
        name: "Main Cafeteria",
        description: "Updated description"
      }
    );

    const deletedOption = await service.deactivateStructuredOption(
      context,
      context.selectedCampusId,
      createdOption.optionId
    );

    expect(createdOption.name).toBe("Campus Cafeteria");
    expect(updatedOption.name).toBe("Main Cafeteria");
    expect(updatedOption.description).toBe("Updated description");
    expect(deletedOption).toEqual({
      deactivated: true,
      resourceType: "CampusStructuredOption",
      resourceId: createdOption.optionId
    });
    expect(
      store.structuredOptions.find((option) => option.optionId === createdOption.optionId)?.isActive
    ).toBe(false);
  });

  it("rejects invalid optionType values", async () => {
    const service = createCampusOptionsService(createCampusOptionsStore());

    await expect(
      service.createStructuredOption(createAdminContext(), createAdminContext().selectedCampusId, {
        optionType: "unsupported_option_type" as CampusStructuredOptionType,
        name: "Lunch"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects unauthorized campus access", async () => {
    const service = createCampusOptionsService(createCampusOptionsStore());

    await expect(
      service.listStructuredOptions(
        createAdminContext({
          authorizedCampusIds: ["56ad6143-a1b1-4c40-bc4a-c41795bbcfaf"]
        }),
        "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
        {}
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });
});

function createCampusOptionsService(store: {
  campuses: Campus[];
  structuredOptions: CampusStructuredOption[];
}) {
  return new CampusOptionsService(
    {
      async findByCampusId(campusId: string) {
        return store.campuses.find((campus) => campus.campusId === campusId) ?? null;
      }
    },
    {
      async findByCampus({
        campusId,
        optionType,
        includeInactive
      }: {
        campusId: string;
        optionType?: CampusStructuredOptionType;
        includeInactive?: boolean;
      }) {
        return store.structuredOptions
          .filter((option) => option.campusId === campusId)
          .filter((option) => !optionType || option.optionType === optionType)
          .filter((option) => includeInactive || option.isActive)
          .sort((left, right) => left.name.localeCompare(right.name));
      },
      async findByCampusAndOptionId(campusId: string, optionId: string) {
        return (
          store.structuredOptions.find(
            (option) => option.campusId === campusId && option.optionId === optionId
          ) ?? null
        );
      },
      async findByCampusTypeAndName(
        campusId: string,
        optionType: CampusStructuredOptionType,
        name: string
      ) {
        return (
          store.structuredOptions.find(
            (option) =>
              option.campusId === campusId && option.optionType === optionType && option.name === name
          ) ?? null
        );
      },
      async findSelectableOption(
        campusId: string,
        optionId: string,
        optionType: CampusStructuredOptionType
      ) {
        return (
          store.structuredOptions.find(
            (option) =>
              option.campusId === campusId &&
              option.optionId === optionId &&
              option.optionType === optionType &&
              option.isActive
          ) ?? null
        );
      },
      instantiate(payload: Partial<CampusStructuredOption>) {
        return {
          optionId: "6d8d696e-9d94-4d2a-a70e-8a2f6ee36ad4",
          createdAt: new Date("2026-05-10T00:00:00Z"),
          updatedAt: new Date("2026-05-10T00:00:00Z"),
          ...payload
        } as CampusStructuredOption;
      },
      async persist(option: CampusStructuredOption) {
        const existingOptionIndex = store.structuredOptions.findIndex(
          (existingOption) => existingOption.optionId === option.optionId
        );

        option.updatedAt = new Date("2026-05-10T01:00:00Z");

        if (existingOptionIndex >= 0) {
          store.structuredOptions[existingOptionIndex] = option;
          return option;
        }

        store.structuredOptions.push(option);
        return option;
      }
    },
    new CampusAuthorizationService()
  );
}

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

function createCampusOptionsStore(): {
  campuses: Campus[];
  structuredOptions: CampusStructuredOption[];
} {
  const activeCategory = createOption({
    optionId: "adcf7261-b932-45ab-936f-ea176bacde65",
    optionType: CampusStructuredOptionType.ActivityCategory,
    name: "Lunch",
    isActive: true
  });
  const inactiveCategory = createOption({
    optionId: "a6c2deab-14a9-4d52-98cc-1fe35ce9a5f1",
    optionType: CampusStructuredOptionType.ActivityCategory,
    name: "Study",
    isActive: false
  });
  const activeLocation = createOption({
    optionId: "8c1a6f1d-0f0f-44c8-aa34-189971bdd6a0",
    optionType: CampusStructuredOptionType.CampusLocation,
    name: "Jiading Library",
    isActive: true
  });
  const otherCampusOption = {
    ...createOption({
      optionId: "4fe898f8-8bd7-4a46-b5d9-c7d56d3f88f7",
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Other Campus"
    }),
    campusId: "d4a9712e-7ef8-43e7-9a5e-bf8d6757d3a4"
  };

  return {
    campuses: [
      {
        campusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
        universityName: "Tongji University",
        campusName: "Jiading Campus",
        activationStatus: true
      }
    ],
    structuredOptions: [activeCategory, inactiveCategory, activeLocation, otherCampusOption]
  };
}

function createOption(
  overrides: Partial<CampusStructuredOption> & Pick<CampusStructuredOption, "optionId" | "optionType" | "name">
): CampusStructuredOption {
  return {
    optionId: overrides.optionId,
    campusId: "9e91dded-c0a3-4d6f-b0d8-6c56b3f3be81",
    optionType: overrides.optionType,
    name: overrides.name,
    description: overrides.description ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: new Date("2026-05-10T00:00:00Z"),
    updatedAt: new Date("2026-05-10T00:00:00Z")
  };
}
