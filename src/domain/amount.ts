export class Amount {
  constructor(public readonly value: number) {}

  static debit(value: number): Amount {
    return new Amount(value < 0 ? value : -value)
  }

  static credit(value: number): Amount {
    return new Amount(Math.abs(value))
  }
}
