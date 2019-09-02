module Os exposing (..)


type alias Id =
    Int


type Fs
    = Dir ( List String, String, List Fs )
    | File ( List String, String, Id )


queryPath : Fs -> Fs -> List String -> Maybe Fs
queryPath root current path =
    case path of
        [] ->
            Just current

        "." :: tail ->
            queryPath root current tail

        ".." :: tail ->
            case current of
                File ( parent, _, _ ) ->
                    queryPath root root (List.append parent tail)

                Dir ( parent, _, _ ) ->
                    queryPath root root (List.append parent tail)

        name :: tail ->
            case current of
                File _ ->
                    Nothing

                Dir ( _, _, children ) ->
                    children
                        |> List.filterMap
                            (\child ->
                                case child of
                                    File ( _, fname, _ ) ->
                                        if fname == name then
                                            queryPath root child tail

                                        else
                                            Nothing

                                    Dir ( _, dname, _ ) ->
                                        if dname == name then
                                            queryPath root child tail

                                        else
                                            Nothing
                            )
                        |> List.head
