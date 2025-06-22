export class Description {
  public readonly value: string

  constructor(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      throw new Error("Description cannot be empty")
    }
    this.value = trimmed
  }

  toString(): string {
    return this.value
  }
}
