// Activity categories shown on My Account. DISPLAY ONLY: these never grant
// access to anything. Access is decided by profiles.role in the database
// (admin / super_admin / reviewer / business_owner), which users cannot change.
// EDIT THE NUMBERS HERE to adjust the thresholds.
window.GW_ENGAGEMENT = {
  frequentTravellerTrips: 3,      // trips saved within the window below
  frequentTravellerMonths: 12,
  explorerSavedBusinesses: 5,     // businesses saved (all time)
  explorerProfileViews: 20,       // profile views in 30 days; used once view tracking exists
  explorerViewDays: 30
};
