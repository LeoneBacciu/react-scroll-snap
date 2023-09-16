import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import "./fullpage.css";
import animateScrollTo, { IOptions } from "animated-scroll-to";

const clamp = (min: number, value: number, max: number) =>
  // eslint-disable-next-line no-nested-ternary
  min > value ? min : max < value ? max : value;

type ScrollOptions = IOptions;

interface FullPageSnapProps {
  children: JSX.Element | JSX.Element[];
  speedUp: number;
  speedDown: number;
  scrollOptions?: Omit<
    ScrollOptions,
    "speed" | "cancelOnUserAction" | "verticalOffset" | "elementToScroll"
  >;
  // eslint-disable-next-line no-unused-vars
  initialPage?: (page: number) => void;
  // eslint-disable-next-line no-unused-vars
  beforePageChange?: (currentPage: number, nextPage: number) => void;
  // eslint-disable-next-line no-unused-vars
  afterPageChange?: (previousPage: number, currentPage: number) => void;
}

interface FullPageSnapHandle {
  // eslint-disable-next-line no-unused-vars
  goToPage: (page: number, speed?: number) => void;
}

const FullPageSnap: React.ForwardRefRenderFunction<
  FullPageSnapHandle,
  FullPageSnapProps
> = (
  {
    children,
    speedUp,
    speedDown,
    initialPage,
    afterPageChange,
    beforePageChange,
    scrollOptions,
  }: FullPageSnapProps,
  ref
) => {
  const internalChildren = React.Children.toArray(children);
  const internalPages = useRef<number>(internalChildren.length);
  const currentPage = useRef<number>(0);
  const internalPrevTouch = useRef<number | null>(null);
  const isAnimating = useRef<boolean>(false);

  useEffect(() => {
    currentPage.current = Math.round(window.scrollY / window.innerHeight);
    animateScrollTo(window.innerHeight * currentPage.current, {
      maxDuration: 0,
      cancelOnUserAction: false,
    }).then(() => {
      if (initialPage) initialPage(currentPage.current);
    });
  }, []);

  const scrollPage = useCallback(
    async (down: boolean, pages: number = 1, speed: number | undefined = undefined) => {
      if (isAnimating.current) return;

      isAnimating.current = true;

      const nextPage = clamp(
        0,
        currentPage.current + (down ? pages : -pages),
        internalPages.current - 1
      );

      if (beforePageChange) beforePageChange(currentPage.current, nextPage);

      const options = {
        ...scrollOptions,
        // eslint-disable-next-line no-nested-ternary
        speed: speed !== undefined ? speed : down ? speedDown : speedUp,
        cancelOnUserAction: false,
        verticalOffset: 0,
        elementToScroll: window,
      };
      const success = await animateScrollTo(
        window.innerHeight * nextPage,
        options
      );
      isAnimating.current = false;
      if (success) {
        const oldPage = currentPage.current;
        currentPage.current = nextPage;
        if (afterPageChange) afterPageChange(oldPage, currentPage.current);
      }
    },
    [internalPages.current, scrollOptions, speedUp, speedDown]
  );

  useImperativeHandle(ref, () => ({
    goToPage: async (page: number, speed?: number) => {
      const steps = currentPage.current - page;
      scrollPage(page > currentPage.current, Math.abs(steps), speed).then();
    },
  }));

  useEffect(() => {
    internalPages.current = internalChildren.length;
  }, [internalChildren]);

  const resizeScroll = useCallback(() => {
    animateScrollTo(window.innerHeight * currentPage.current, {
      maxDuration: 0,
      cancelOnUserAction: false,
    }).then();
  }, []);

  const touchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();
      if (isAnimating.current) return;

      if (internalPrevTouch.current !== null) {
        scrollPage(event.touches[0].clientY < internalPrevTouch.current).then();
        internalPrevTouch.current = null;
      } else {
        internalPrevTouch.current = event.touches[0].clientY;
      }
    },
    [scrollPage]
  );

  const wheelScroll = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      scrollPage(event.deltaY >= 0).then();
    },
    [scrollPage]
  );

  const keyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        scrollPage(false).then();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        scrollPage(true).then();
      }
    },
    [scrollPage]
  );

  useEffect(() => {
    let passiveOption: boolean | { passive: boolean } = false;
    const options = {
      get passive() {
        passiveOption = { passive: false };
        return false;
      },
    };
    const noop = () => {};
    window.addEventListener("p", noop, options);
    window.removeEventListener("p", noop, false);

    window.addEventListener("wheel", wheelScroll, passiveOption);
    window.addEventListener("touchmove", touchMove, passiveOption);
    window.addEventListener("keydown", keyPress, passiveOption);
    window.addEventListener("resize", resizeScroll);
    return () => {
      window.removeEventListener("wheel", wheelScroll);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("keydown", keyPress);
      window.removeEventListener("resize", resizeScroll);
    };
  }, [wheelScroll, keyPress, touchMove]);

  return (
    <div className="snap-pages-container">
      {internalChildren.map((c, i) => (
        <div className="page" key={React.isValidElement(c) ? c.key : i}>
          {c}
        </div>
      ))}
    </div>
  );
};

export default React.forwardRef(FullPageSnap);
