module Fs exposing (..)


type alias Id =
    String


type alias Path =
    List String


type alias AbsolutePath =
    List String


type Fs
    = Dir ( String, List Fs )
    | File ( String, Id )


isDir : Fs -> Bool
isDir fs =
    case fs of
        Dir _ ->
            True

        _ ->
            False


getName : Fs -> String
getName fs =
    case fs of
        Dir ( name, _ ) ->
            name

        File ( name, _ ) ->
            name


changeName : Fs -> String -> Fs
changeName fs name =
    case fs of
        Dir ( _, children ) ->
            Dir ( name, children )

        File ( _, id ) ->
            File ( name, id )


queryPathAbs : Fs -> AbsolutePath -> Maybe Fs
queryPathAbs fs path =
    case path of
        -- unreachable
        [] ->
            Nothing

        -- unreachable
        "." :: _ ->
            Nothing

        -- unreachable
        ".." :: _ ->
            Nothing

        name :: [] ->
            case fs of
                (File ( fname, _ )) as f ->
                    if name == fname then
                        Just f

                    else
                        Nothing

                (Dir ( dname, _ )) as d ->
                    if name == dname then
                        Just d

                    else
                        Nothing

        name :: tail ->
            case fs of
                File _ ->
                    Nothing

                Dir ( dname, children ) ->
                    if name == dname then
                        children
                            |> List.map (\child -> queryPathAbs child tail)
                            |> List.filterMap identity
                            |> List.head

                    else
                        Nothing


removeFile : AbsolutePath -> Fs -> Fs
removeFile path =
    fsMap
        (\brothers current ->
            List.filter (\boy -> path /= List.append current [ getName boy ]) brothers
        )


overwriteFile : AbsolutePath -> Fs -> Fs -> Fs
overwriteFile path src =
    fsMap
        (\brothers current ->
            if path == current then
                src :: List.filter (\boy -> getName boy /= getName src) brothers

            else
                brothers
        )


fsMap : (List Fs -> AbsolutePath -> List Fs) -> Fs -> Fs
fsMap f root =
    let
        impl g fs current =
            case fs of
                File _ ->
                    fs

                Dir ( dname, children ) ->
                    Dir
                        ( dname
                        , List.map (\child -> impl g child (List.append current [ dname ])) (g children (List.append current [ dname ]))
                        )
    in
    impl f root []
