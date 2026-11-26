/* =====================================================================
   SETTINGS
   ---------------------------------------------------------------------
   Your photos, videos and notes go in the  media/  folder. The timeline
   is built from their names automatically (see README.md). This file
   only holds the site's wording and a few settings.
   ===================================================================== */

window.SITE = {
  title: "A Life, Unfolding",
  subtitle: "influences · moments · things I made",

  // Opening screen. Leave video empty to use the generated blurry,
  // waving vegetation. To use your own, upload it and put e.g.
  //   video: "media/intro.mp4"
  // (it is blurred automatically; set blur to 0 if it already is).
  intro: {
    video: "",
    blur: 18,
    invite: "Step inside",
    hint: "Best viewed in landscape on a tablet or larger",
  },

  travelSeconds: 2.2,        // auto-play: time spent gliding between entries
  galleryPhotoSeconds: 4,    // auto-play: time on each picture in a folder slideshow

  lanes: {
    life:      { label: "Life",       color: "#e8c77a" },
    influence: { label: "Influences", color: "#8fc3d9" },
    creation:  { label: "Creations",  color: "#e08a7a" },
  },

  // Optional: entries typed by hand, in addition to the media folder.
  // Handy for the built-in animations ("ripples" or "drift"), e.g.
  //   { date: "1983", lane: "creation", type: "animation", animation: "ripples",
  //     title: "First experiments", duration: 7 },
  entries: [],
};
