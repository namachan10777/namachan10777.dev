module Os exposing (..)


type alias Id =
    Int


type Fs
    = Dir ( String, List Fs )
    | File ( String, Id )


getFromAbsPath : List String -> Fs -> Maybe Fs
getFromAbsPath path dir =
    case dir of
        Dir ( dirname, children ) ->
            case path of
                [] ->
                    Nothing

                name :: [] ->
                    if name == dirname then
                        Just dir

                    else
                        Nothing

                name :: tail ->
                    if name == dirname then
                        children |> List.map (getFromAbsPath tail) |> List.filterMap identity |> List.head

                    else
                        Nothing

        File ( filename, id ) ->
            case path of
                name :: [] ->
                    if name == filename then
                        Just dir

                    else
                        Nothing

                _ ->
                    Nothing
