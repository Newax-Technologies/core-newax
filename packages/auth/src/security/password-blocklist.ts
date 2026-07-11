export interface PasswordBlocklist {
  contains(password: string): Promise<boolean>;
}
