import { useState } from "react";

import useSiasisAPIs from "./useSiasisAPIs";

import {
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";

const useRequestAPIFeatures = (
  siasisAPI: SiasisAPIS,
  initialStateLoading: boolean = false
) => {
  const [isSomethingLoading, setIsSomethingLoading] =
    useState(initialStateLoading);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);
  const [successMessage, setSuccessMessage] = useState<MessageProperty | null>(
    null
  );
  const { fetchSiasisAPI, fetchCancelables, cancelAllRequests } =
    useSiasisAPIs(siasisAPI);

  return {
    fetchSiasisAPI,
    fetchCancelables,
    isSomethingLoading,
    setIsSomethingLoading,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    cancelAllRequests,
  };
};

export default useRequestAPIFeatures;
