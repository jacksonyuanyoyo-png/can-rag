import { cls } from "./utils"

export default function Message({ role, children }) {
  const isUser = role === "user"
  return (
    <div className={cls("flex w-full items-start gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-bold text-white dark:bg-white dark:text-slate-950">
          AI
        </div>
      )}
      <div
        className={cls(
          "max-w-[72%] rounded-3xl px-4 py-2.5 text-sm shadow-sm backdrop-blur-xl",
          isUser
            ? "bg-black text-white dark:bg-white dark:text-slate-950"
            : "border border-white/60 bg-white/65 text-gray-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100",
        )}
      >
        {children}
      </div>
      {isUser && (
        <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-bold text-white dark:bg-white dark:text-slate-950">
          JD
        </div>
      )}
    </div>
  )
}
