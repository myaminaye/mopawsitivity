import { JSX } from "react";

type SwarmSlide = {
  id: number;
  type: "swarm";
  text: string | JSX.Element;
  cats: string[];
  layout: { top: string; left: string; size: number }[];
};

type SingleSlide = {
  id: number;
  type: "single";
  text: string | JSX.Element;
  cat: string;
};

type SingleFlipSlide = {
  id: number;
  type: "singleFlip";
  text: string | JSX.Element;
  cat: string;
};

type TextOnlySlide = {
  id: number;
  type: "textOnly";
  text: string | JSX.Element;
};

export type Slide = SwarmSlide | SingleSlide | SingleFlipSlide | TextOnlySlide;
