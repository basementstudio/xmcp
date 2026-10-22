/** Validate booking details using inferred constraints. */
export default function book(input: {
  /** Day of the month.
   * @minimum 1
   * @maximum 31
   */
  day: number;
  /** Contact address.
   * @format email
   */
  email: string;
  /** Booking reference.
   * @minLength 2
   * @maxLength 8
   * @pattern ^[A-Z]+$
   */
  reference?: string;
  /** Whether to confirm the booking. */
  confirmed?: boolean;
}) {
  return JSON.stringify(input);
}
