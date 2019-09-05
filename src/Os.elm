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
                          , File ( [ "usr", "bin" ], "mv", 3 )
                          , File ( [ "usr", "bin" ], "rm", 4 )
                          , File ( [ "usr", "bin" ], "cd", 5 )
                          , File ( [ "usr", "bin" ], "ls", 5 )
                          , File ( [ "usr", "bin" ], "pwd", 6 )
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


initialSystem : System
initialSystem =
    { root = initialFs
    , current = initialFs
    }


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


type
    Output
    -- class src author
    = Img ( String, String, Maybe ( String, String ) )
    | Str String


type CmdResult
    = Stdout (List Output)
    | NoCmd
    | Clear


execEcho : System -> List String -> ( CmdResult, System )
execEcho system args =
    ( Stdout [ Str (String.join " " args) ], system )


execCat : System -> List String -> ( CmdResult, System )
execCat system args =
    args
        |> List.map
            (\arg ->
                case resolvePath system arg of
                    Succes (File ( _, fname, id )) ->
                        case id of
                            8 ->
                                Str "Nakano Masaki<namachan10777@gmail.com\n"

                            7 ->
                                Img ( "icon", "./res/icon.jpg", Just ( "@hsm_hx", "https://twitter.com/hsm_hx" ) )

                            _ ->
                                Str (String.append fname " is not a text file\n")

                    Succes (Dir ( _, dname, _ )) ->
                        Str (String.append dname " is a directory\n")

                    IsNotDir (File ( _, fname, id )) ->
                        Str (String.append fname " is not a directory\n")

                    _ ->
                        Str (String.append arg " is not found\n")
            )
        |> (\outputs -> ( Stdout outputs, system ))


execMv : System -> List String -> ( CmdResult, System )
execMv system _ =
    ( NoCmd, system )


execRm : System -> List String -> ( CmdResult, System )
execRm system _ =
    ( NoCmd, system )


execCd : System -> List String -> ( CmdResult, System )
execCd system _ =
    ( NoCmd, system )


execLs : System -> List String -> ( CmdResult, System )
execLs system _ =
    ( NoCmd, system )


execPwd : System -> List String -> ( CmdResult, System )
execPwd system _ =
    ( NoCmd, system )


exec : System -> String -> List String -> ( CmdResult, System )
exec system path args =
    case resolveExe system path of
        Succes (File ( _, _, 0 )) ->
            execEcho system args

        Succes (File ( _, _, 1 )) ->
            execCat system args

        Succes (File ( _, _, 3 )) ->
            execMv system args

        Succes (File ( _, _, 4 )) ->
            execRm system args

        Succes (File ( _, _, 5 )) ->
            execCd system args

        Succes (File ( _, _, 6 )) ->
            execLs system args

        Succes (File ( _, _, 7 )) ->
            execPwd system args

        _ ->
            ( NoCmd, system )


enumerateCmds : System -> List String
enumerateCmds system =
    case resolvePath system exePath of
        Succes (Dir ( _, _, files )) ->
            files
                |> List.filterMap
                    (\file ->
                        case file of
                            File ( _, name, _ ) ->
                                Just name

                            _ ->
                                Nothing
                    )

        _ ->
            []
