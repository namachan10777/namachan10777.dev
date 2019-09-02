module Os exposing (..)


type alias Id =
    Int


type Fs
    = Dir ( String, List Fs )
    | File ( String, Id )


getFromAbsPath : List String -> Fs -> Maybe Fs
getFromAbsPath path dir =
    case path of
        [] ->
            Just dir

        name :: tail ->
            case dir of
                File _ ->
                    Nothing

                Dir ( _, children ) ->
                    children
                        |> List.filterMap
                            (\child ->
                                case child of
                                    File ( fname, _ ) ->
                                        if fname == name then
                                            getFromAbsPath tail child

                                        else
                                            Nothing

                                    Dir ( dname, _ ) ->
                                        if dname == name then
                                            getFromAbsPath tail child

                                        else
                                            Nothing
                            )
                        |> List.head


type Resolved
    = Exist Fs
    | IsNotDir Fs
    | NotFound


// FIXME
resolvePath : Fs -> Fs -> String -> Resolved
resolvePath root current text =
    let
        ( base, frontShrinked ) =
            if String.startsWith "/" text then
                ( root, String.dropLeft 1 text )

            else if String.startsWith "./" text then
                ( current, String.dropLeft 2 text )

            else
                ( current, text )
    in
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" text then
                ( True, String.dropRight 1 frontShrinked )

            else
                ( False, frontShrinked )

        splited =
            if shrinked == "" then
                []

            else
                String.split "/" shrinked
    in
    case ( dirExpect, getFromAbsPath splited base ) of
        ( True, Just (Dir fs) ) ->
            Exist (Dir fs)

        ( True, Just (File fs) ) ->
            IsNotDir (File fs)

        ( False, Just fs ) ->
            Exist fs

        ( _, Nothing ) ->
            NotFound
