import { query } from ".";

export async function getSiteSettings() {
  let data = null;
  data = await query.siteSettings.findFirst(); // TODO: CHECK WORKING
  if (!data) {
    data = await query.siteSettings.insert({
      resultsOut: false,
      paymentsOpen: false,
      registrationsOpen: false,
    });
  }
  return data;
}
