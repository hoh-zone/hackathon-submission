import { toast } from "sonner";

export function useToast() {
  const successToast = (message: string) => {
    return toast.success(message, {
      style: { backgroundColor: "green", color: "white" },
      position: "top-center",
    });
  };
  const errorToast = (message: string) => {
    return toast.error(message, {
      style: { backgroundColor: "red", color: "white" },
      position: "top-center",
    });
  };
  return {
    successToast,
    errorToast,
  };
}
