import IconComponent from "../IconComponent/IconComponent";
import style from "./Toast.module.scss";
import PropTypes from "prop-types";
import toast from "../../store/zustand/toast";

// prop classname berupa string ("!w-200 px-3"). prop ini opsional jika membutuhkan custom main toastnya
// prop type memiliki 2 value string. jika tidak diisi/default value nya. maka akan memiliki default value "error". sedangkan jika diisi "success" akan menampilkan toast success
// prop children berupa string/tag element html ("toast"/<span>toas dalam elemen</span>)
// prop iconSrc berupa base url icon string ("../../icons/amandemen-tender.svg"). iconSrc akan mengubah tampilan default icon di kiri (bukan close). prop ini bersifat opsional
// prop onclick berupa fungsi event (() => //("clicked")). prop ini berfungsi memberikan fungsi ketika icon close ditekan.

const Toast = ({ classname, type, children = "Toast", onclick, iconSrc }) => {
  const { showToast, setShowToast } = toast();

  // kalau jadi ada timer untuk close popup, nyalakan fungsi dibawah + pasang state sesuai kondisinya
  // useEffect(() => {
  //   if (show) {
  //     const timer = setTimeout(() => {
  //       onclick();
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [show, onclick]);

  return (
    <>
      <div
        className={`sm:w-auto sm:bottom-[147px] sm:left-0 sm:right-0 sm:mx-4 flex gap-[4px] items-center justify-between w-[440px] h-fit leading-[14.4px] font-semibold text-[12px] rounded-[6px] py-[15px] px-[12px] border text-neutral-900 fixed bottom-[75px] right-[25px] transform transition-all duration-500 ease-in-out ${
          showToast ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } ${
          type == "success"
            ? "bg-[#fff2e6] border-[#0fbb81]"
            : "bg-[#ffe9ed] border-[#ee4343]"
        } ${classname}`}
      >
        <div className="flex items-center w-[380px] gap-[12px]">
          <div className="w-5">
            <IconComponent
              classname={
                iconSrc
                  ? ""
                  : type === "success"
                  ? style.icon_success
                  : style.icon_error
              }
              src={
                iconSrc
                  ? iconSrc
                  : type === "success"
                  ? "/icons/success-toast.svg"
                  : "/icons/warning.svg"
              }
              height={20}
              width={20}
            />
          </div>
          {children}
        </div>
        <IconComponent
          src="/icons/silang.svg"
          height={20}
          width={20}
          classname="cursor-pointer"
          onclick={() => onclick ? onclick : setShowToast(false)}
        />
      </div>
    </>
  );
};

export default Toast;

Toast.prototype = {
  classname: PropTypes.string,
  type: PropTypes.string,
  children: PropTypes.string,
  onclick: PropTypes.func,
};
