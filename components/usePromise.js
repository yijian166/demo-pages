import { useCallback, useEffect, useState } from 'react';

const getSignal = () => {
  if (!window.AbortController) {
    return null;
  }
  const controller = new AbortController();
  const signal = controller.signal;
  return { controller, signal };
};
const usePromise = (asyncFun, inputs = []) => {
  if (!inputs) {
    console.warn('注意!， 异步effect，不使用第二个参数会引起无限刷新');
  }
  const [state, setState] = useState({
    isLoading: true,
  });
  const memoized = useCallback(asyncFun, inputs);
  useEffect(() => {
    let canceled = false;
    // const source = ApiRequest.cancelTokenSource;
    const source = getSignal();
    (async () => {
      try {
        setState({
          isLoading: true,
        });
        const data = await memoized(source?.signal ?? undefined);
        if (canceled) {
          return;
        }
        setState({
          isLoading: false,
          data: data,
        });
      } catch (error) {
        setState({
          isLoading: false,
          error,
        });
      }
    })();
    return () => {
      canceled = true;
      source?.controller?.abort();
    };
  }, [memoized]);

  return state;
};

export default usePromise;
