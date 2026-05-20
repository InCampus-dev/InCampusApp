// Task: AP05 | Path: backend/packages/access-profile/src/services/EmailVerificationService.ts

export class EmailVerificationService {
  public async sendVerificationEmail(email: string, token: string | null): Promise<void> {
    // Mock gateway — no real email is sent in the alpha skeleton.
    // Replace with a real delivery API when moving beyond alpha.
    console.log(`[MOCK EMAIL] Verification token for ${email}: ${token}`);
  }
}
