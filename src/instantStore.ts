import { GetInstantStore } from "./modules/Cache.ts";
import { wd_UserId } from "./wdelivery/main.ts";

export const instantStoreNamingScheme = `${wd_UserId}/Lyrprep/InstantStore`

export const instantStore = GetInstantStore(
  instantStoreNamingScheme,
  1,
  {
    SK_Store: "",
    settings: {
      removeTimestamps: true,
      handleDashes: true,
      handleParentheses: true,
      addSpaces: true,
      splitCJK: true,
      removeEmptyLines: true,
      theme: 'system',
      seasonalTheme: true,
    },
		asrCheck: {
			token: ""
		},
    lastLyrics: "",
  }
);