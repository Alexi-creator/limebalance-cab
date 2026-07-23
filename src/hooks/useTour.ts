import { type DriveStep, driver } from "driver.js"
import type { TFunction } from "i18next"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

// Shared across every page: the "?" button always looks and behaves the same, so once the
// user has seen the hint pointing at it anywhere, it shouldn't repeat itself on other pages.
const HINT_SEEN_KEY = "tour-hint-seen"

interface UseTourOptions {
  /**
   * Prepend the shared nav + "Add" intro steps (sidebar/burger + header "Add" button).
   * Only the home page tour should set this — it's a user's first tour, so it also covers
   * the two elements that live on every page. Other pages assume those were already seen
   * and jump straight to their own content, so the same buttons aren't re-explained on
   * every page.
   */
  includeIntro?: boolean
}

/**
 * Page tour builder shared by every page's guided tour.
 *
 * On a user's first visit to any page using this hook, it also points a one-off hint at
 * the "start tour" button itself (`[data-tour='tour-trigger']`), so they know where to
 * replay the tour later. The seen-flag is written to localStorage as soon as the hint is
 * shown — not on dismissal — so a hard refresh mid-hint can't bring it back on every load.
 */
export function useTour(
  buildSteps: (t: TFunction) => DriveStep[],
  { includeIntro = false }: UseTourOptions = {},
) {
  const { t } = useTranslation()
  const hintRef = useRef<ReturnType<typeof driver> | null>(null)

  useEffect(() => {
    // Deferred so StrictMode's dev-only mount→cleanup→mount doesn't create a driver
    // instance on the phantom first mount, just to destroy it again before it ever
    // paints — the cleanup below clears this timer before it can fire.
    const timer = setTimeout(() => {
      if (localStorage.getItem(HINT_SEEN_KEY)) return
      localStorage.setItem(HINT_SEEN_KEY, "1")

      const hint = driver()
      hintRef.current = hint
      hint.highlight({
        element: "[data-tour='tour-trigger']",
        popover: {
          title: t("tour.hint_title"),
          description: t("tour.hint_desc"),
          side: "left",
        },
      })
    }, 0)

    return () => {
      clearTimeout(timer)
      hintRef.current?.destroy()
      hintRef.current = null
    }
  }, [t])

  const startTour = () => {
    // the hint (if still showing) and the real tour would otherwise both toggle the
    // shared driver.js overlay state at once
    hintRef.current?.destroy()
    hintRef.current = null

    const introSteps: DriveStep[] = []

    if (includeIntro) {
      // Below the "sm" breakpoint the navbar is collapsed off-canvas and the burger takes
      // its place in the header — point the step at whichever one is actually visible.
      const burger = document.querySelector<HTMLElement>("[data-tour='nav-burger']")
      const isMobileNav = burger !== null && getComputedStyle(burger).display !== "none"

      introSteps.push(
        isMobileNav
          ? {
              element: "[data-tour='nav-burger']",
              popover: {
                title: t("tour.nav_mobile_title"),
                description: t("tour.nav_mobile_desc"),
                side: "bottom",
              },
            }
          : {
              element: "[data-tour='nav']",
              popover: {
                title: t("tour.nav_title"),
                description: t("tour.nav_desc"),
                side: "right",
              },
            },
        {
          element: "[data-tour='add-button']",
          popover: {
            title: t("tour.add_title"),
            description: t("tour.add_desc"),
            side: "bottom",
            align: "end",
          },
        },
      )
    }

    driver({
      showProgress: true,
      nextBtnText: t("tour.next"),
      prevBtnText: t("tour.prev"),
      doneBtnText: t("tour.done"),
      progressText: t("tour.progress"),
      steps: [...introSteps, ...buildSteps(t)],
    }).drive()
  }

  return { startTour }
}
