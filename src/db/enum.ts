import { pgEnum } from "drizzle-orm/pg-core";

export const stateEnum = pgEnum("state", [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttarakhand",
  "Uttar Pradesh",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli",
  "Lakshadweep Islands",
]);

export const courseEnum = pgEnum("course", ["BTech", "BE", "BCA", "BSc"]);

export const genderEnum = pgEnum("gender", [
  "Male",
  "Female",
  "Prefer Not To Say",
]);

export const teamStatusEnum = pgEnum("team_status", [
  "Not Selected",
  "Under Review",
  "Selected",
  "Rejected",
  "Winner",
  "Runner Up",
  "Second Runner Up",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "Pending",
  "Paid",
  "Refunded",
]);

export const teamProgressEnum = pgEnum("team_progress", [
  "WINNER",
  "RUNNER",
  "SECOND_RUNNER",
  "TRACK",
  "PARTICIPATION",
]);
