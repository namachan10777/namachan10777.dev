module Os exposing (..)


type alias Id =
    Int


type Fs
    = Dir ( List String, String, List Fs )
    | File ( List String, String, Id )


type alias System =
    { root : Fs
    , current : Fs
    }


exePath : String
exePath =
    "/usr/bin/"


initialFs : Fs
initialFs =
    Dir
        ( []
        , ""
        , [ Dir
                ( []
                , "usr"
                , [ Dir
                        ( [ "usr" ]
                        , "bin"
                        , [ File ( [ "usr", "bin" ], "echo", 0 )
                          , File ( [ "usr", "bin" ], "cat", 1 )
                          , File ( [ "usr", "bin" ], "show-img", 2 )
                          , File ( [ "usr", "bin" ], "mv", 3 )
                          , File ( [ "usr", "bin" ], "rm", 4 )
                          , File ( [ "usr", "bin" ], "cd", 5 )
                          , File ( [ "usr", "bin" ], "ls", 5 )
                          , File ( [ "usr", "bin" ], "pwd", 6 )
                          , File ( [ "usr", "bin" ], "ls", 7 )
                          ]
                        )
                  ]
                )
          , Dir
                ( []
                , "home"
                , [ Dir
                        ( [ "home" ]
                        , "namachan"
                        , [ File ( [ "home", "namachan" ], "icon", 7 )
                          , File ( [ "home", "namachan" ], "basic-info", 8 )
                          ]
                        )
                  ]
                )
          ]
        )


queryPath : System -> List String -> Maybe Fs
queryPath system path =
    case path of
        [] ->
            Just system.current

        "." :: tail ->
            queryPath system tail

        ".." :: tail ->
            case system.current of
                File ( parent, _, _ ) ->
                    queryPath { root = system.root, current = system.root } (List.append parent tail)

                Dir ( parent, _, _ ) ->
                    queryPath { root = system.root, current = system.root } (List.append parent tail)

        name :: tail ->
            case system.current of
                File _ ->
                    Nothing

                Dir ( _, _, children ) ->
                    children
                        |> List.filterMap
                            (\child ->
                                case child of
                                    File ( _, fname, _ ) ->
                                        if fname == name then
                                            queryPath { root = system.root, current = child } tail

                                        else
                                            Nothing

                                    Dir ( _, dname, _ ) ->
                                        if dname == name then
                                            queryPath { root = system.root, current = child } tail

                                        else
                                            Nothing
                            )
                        |> List.head


type Resolved
    = Succes Fs
    | IsNotDir Fs
    | NotFound


resolvePath : System -> String -> Resolved
resolvePath system path =
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" path then
                ( True, String.dropRight 1 path )

            else
                ( False, path )

        queried =
            if String.startsWith "/" path then
                if path == "/" then
                    Just system.root

                else
                    queryPath { root = system.root, current = system.root } (shrinked |> String.dropLeft 1 |> String.split "/")

            else
                queryPath system (shrinked |> String.split "/")
    in
    case ( dirExpect, queried ) of
        ( True, Just ((File _) as f) ) ->
            IsNotDir f

        ( True, Just ((Dir _) as d) ) ->
            Succes d

        ( _, Just f ) ->
            Succes f

        ( _, Nothing ) ->
            NotFound


resolveExe : System -> String -> Resolved
resolveExe system path =
    if String.startsWith "." path || String.startsWith "/" path then
        resolvePath system path

    else
        case resolvePath system path of
            NotFound ->
                if String.length path < 1 || String.contains "/" path then
                    NotFound

                else
                    resolvePath system (String.append exePath path)

            other ->
                other
