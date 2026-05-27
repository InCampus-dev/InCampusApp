export function assertLocalDemoEnvironment(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production");
  }
}
