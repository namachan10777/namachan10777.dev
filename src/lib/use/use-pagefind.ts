import { Options, PagefindApi, loadPagefind } from "~/misc/pagefind";

interface UsePagefindArg {
    api: PagefindApi,
}

export function usePagefind(hook: (api: PagefindApi) => Promise<void>, options?: Options): void {
    const main = async () => {
        const api = await loadPagefind();
        if (options) {
            api.options(options);
        }
        await api.init();
        hook(api);
    };
    main();
}