import { pgEnum } from "drizzle-orm/pg-core";

export enum StateEnum {
  AndhraPradesh = "Andhra Pradesh",
  ArunachalPradesh = "Arunachal Pradesh",
  Assam = "Assam",
  Bihar = "Bihar",
  Chandigarh = "Chandigarh",
  Chhattisgarh = "Chhattisgarh",
  DadraAndNagarHaveliAndDamanAndDiu = "Dadra and Nagar Haveli and Daman and Diu",
  Delhi = "Delhi",
  Goa = "Goa",
  Gujarat = "Gujarat",
  Haryana = "Haryana",
  HimachalPradesh = "Himachal Pradesh",
  JammuAndKashmir = "Jammu and Kashmir",
  Jharkhand = "Jharkhand",
  Karnataka = "Karnataka",
  Kerala = "Kerala",
  Lakshadweep = "Lakshadweep",
  MadhyaPradesh = "Madhya Pradesh",
  Maharashtra = "Maharashtra",
  Manipur = "Manipur",
  Meghalaya = "Meghalaya",
  Mizoram = "Mizoram",
  Nagaland = "Nagaland",
  Odisha = "Odisha",
  Puducherry = "Puducherry",
  Punjab = "Punjab",
  Rajasthan = "Rajasthan",
  Sikkim = "Sikkim",
  TamilNadu = "Tamil Nadu",
  Telangana = "Telangana",
  Tripura = "Tripura",
  Uttarakhand = "Uttarakhand",
  UttarPradesh = "Uttar Pradesh",
  WestBengal = "West Bengal",
  AndamanAndNicobarIslands = "Andaman and Nicobar Islands",
  DadraAndNagarHaveli = "Dadra and Nagar Haveli",
  LakshadweepIslands = "Lakshadweep Islands",
}

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

export const courseEnum = pgEnum("course", [
  "BTech",
  "BE",
  "BCA",
  "BSc",
  "BArch (Nitte DU)",
  "MCA",
  "MTech",
]);

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

export const eventTypeEnum = pgEnum("event_type", ["Solo", "Team"]);

export const eventStatusEnum = pgEnum("event_status", [
  "Draft",
  "Published",
  "Ongoing",
  "Completed",
]);

export const eventAudienceEnum = pgEnum("event_audience", [
  "Participants",
  "Non-Participants",
  "Both",
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

export const collegeRequestStatusEnum = pgEnum("college_request_status", [
  "Pending",
  "Approved",
  "Rejected",
]);