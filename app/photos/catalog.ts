export type Photo = {
  id: string;
  title: string;
  alt: string;
  date: string;
  photographer: string;
  src: string;
  width: number;
  height: number;
};

// A fixed, credited sample collection. Dates and dimensions come from NASA's
// Image and Video Library; titles are short display labels, not invented EXIF.
export const photos: readonly Photo[] = [
  {
    id: "iss030e119777",
    title: "Polar light",
    alt: "Green aurora above Earth's curved night horizon, seen from orbit",
    date: "2012-03-03",
    photographer: "Expedition 30 crew",
    src: "/photos/iss030e119777.jpg",
    width: 1280,
    height: 851,
  },
  {
    id: "iss035e017454",
    title: "After dark",
    alt: "Airglow and aurora above the night side of Earth",
    date: "2013-04-06",
    photographer: "Chris Hadfield",
    src: "/photos/iss035e017454.jpg",
    width: 1280,
    height: 851,
  },
  {
    id: "iss039e012272",
    title: "Bahamas & Cuba",
    alt: "Islands and turquoise ocean around the Bahamas and Cuba, seen from space",
    date: "2014-04-15",
    photographer: "Steve Swanson",
    src: "/photos/iss039e012272.jpg",
    width: 1280,
    height: 851,
  },
  {
    id: "iss036e032513",
    title: "Blue shallows",
    alt: "The Bahamas surrounded by shallow blue water",
    date: "2013-08-13",
    photographer: "Karen Nyberg",
    src: "/photos/iss036e032513.jpg",
    width: 1280,
    height: 851,
  },
  {
    id: "iss040e081014",
    title: "Sahara",
    alt: "Sand and rock formations in the Sahara, photographed from orbit",
    date: "2014-07-25",
    photographer: "Alex Gerst",
    src: "/photos/iss040e081014.jpg",
    width: 1280,
    height: 851,
  },
  {
    id: "iss040e081024",
    title: "Desert patterns",
    alt: "Patterns of the Sahara desert viewed from the International Space Station",
    date: "2014-07-25",
    photographer: "Alex Gerst",
    src: "/photos/iss040e081024.jpg",
    width: 1280,
    height: 851,
  },
];

export function photoDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
