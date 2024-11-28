import React from "react";
import IconComponent from "../IconComponent/IconComponent";
import style from "./Bubble.module.scss";
import PropTypes from "prop-types";

const Bubble = ({
  classname,
  fill,
  children = "Label",
  iconLeft = null,
  iconRight = null,
  onClickLeft,
  onClickRight,
}) => {
  return (
    <div
      className={`flex gap-[4px] items-center justify-center max-w-fit h-7 leading-[14.4px] font-semibold text-[10px] rounded-2xl ${
        iconLeft || iconRight ? "py-[7px]" : "py-[11px]"
      } px-3 border border-primary-700 ${
        fill
          ? "bg-primary-700 text-neutral-50"
          : "bg-neutral-50 text-primary-700"
      } ${classname}`}
    >
      {iconLeft && (
        <IconComponent
          src={iconLeft}
          height={14}
          width={14}
          classname={`${!fill ? style.fill_secondary_info : style.fill_white} ${
            onClickLeft !== "" && "cursor-pointer"
          }`}
          onclick={onClickLeft}
        />
      )}
      {children}
      {iconRight && (
        <IconComponent
          src={iconRight}
          height={14}
          width={14}
          classname={`${!fill ? style.fill_secondary_info : style.fill_white} ${
            onClickRight !== "" && "cursor-pointer"
          }`}
          onclick={onClickRight}
        />
      )}
    </div>
  );
};

export default Bubble;

Bubble.prototype = {
  // props classname diisi dengan string terhadap custom class/class tailwind yang anda inginkan ("pt-3 flex flex-col")
  classname: PropTypes.string,
  // props classname diisi dengan boolean, jika true akan memiliki base background berwarna biru seperti filter muat (true/false)
  fill: PropTypes.boolean,
  // props children diisi dengan string yang terletak pada nama bubble ("Tender")
  children: PropTypes.string,
  // props iconLeft diisi base url icon string ("../../icons/amandemen-tender.svg")
  iconLeft: PropTypes.string,
  // props iconRight diisi base url icon string ("../../icons/amandemen-tender.svg")
  iconRight: PropTypes.string,
  // props onClickLeft diisi fungsi onclick untuk trigger icon posisi kiri (() => //('clicked'))
  onClickLeft: PropTypes.func,
  // props onClickRight diisi fungsi onclick untuk trigger icon posisi kanan (() => //('clicked'))
  onClickRight: PropTypes.func,
};
