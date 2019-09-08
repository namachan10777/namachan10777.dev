module Os exposing (..)


type alias Id =
    String


type Fs
    = Dir ( String, List Fs )
    | File ( String, Id )


normalizePathRev path =
    case path of
        [] ->
            Just []

        "." :: tail ->
            normalizePathRev tail

        ".." :: tail ->
            normalizePathRev tail |> Maybe.andThen List.tail

        other :: tail ->
            normalizePathRev tail |> Maybe.andThen (\succes -> Just (other :: succes))


normalizePath : List String -> Maybe (List String)
normalizePath path =
    path |> List.reverse |> normalizePathRev |> Maybe.map List.reverse


type alias System =
    { root : Fs
    , current : List String
    }


exePath : String
exePath =
    "/usr/bin/"


initialFs : Fs
initialFs =
    Dir
        ( ""
        , [ Dir
                ( "usr"
                , [ Dir
                        ( "bin"
                        , [ File ( "echo", "echo" )
                          , File ( "cat", "cat" )
                          , File ( "mv", "mv" )
                          , File ( "rm", "rm" )
                          , File ( "cd", "cd" )
                          , File ( "ls", "ls" )
                          , File ( "pwd", "pwd" )
                          ]
                        )
                  ]
                )
          , Dir
                ( "home"
                , [ Dir
                        ( "namachan"
                        , [ File ( "icon", "icon" )
                          , File ( "basic-info", "basic-info" )
                          ]
                        )
                  ]
                )
          ]
        )


initialSystem : System
initialSystem =
    { root = initialFs
    , current = [ "" ]
    }


queryPathAbs : Fs -> List String -> Maybe Fs
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


queryPath : System -> List String -> Maybe ( Fs, List String )
queryPath system path =
    let
        normalized =
            case path of
                "" :: _ ->
                    normalizePath path

                _ ->
                    normalizePath (List.append system.current path)
    in
    normalized |> Maybe.andThen (\p -> queryPathAbs system.root p |> Maybe.map (\fs -> ( fs, p )))


type Resolved
    = Succes ( Fs, List String )
    | IsNotDir ( Fs, List String )
    | NotFound


resolvePath : System -> String -> Resolved
resolvePath system path =
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" path then
                ( True, String.dropRight 1 path )

            else
                ( False, path )
    in
    case ( dirExpect, shrinked |> String.split "/" |> queryPath system ) of
        ( True, Just ( (File _) as f, p ) ) ->
            IsNotDir ( f, p )

        ( True, Just ( (Dir _) as d, p ) ) ->
            Succes ( d, p )

        ( _, Just ( f, p ) ) ->
            Succes ( f, p )

        ( _, Nothing ) ->
            NotFound


resolveExe : System -> String -> Resolved
resolveExe system path =
    if String.startsWith "." path || String.startsWith "/" path then
        resolvePath system path

    else if String.length path > 0 && not (String.contains "/" path) then
        resolvePath system (String.append exePath path)

    else
        NotFound


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
                    Succes ( File ( fname, id ), p ) ->
                        case id of
                            "basic-info" ->
                                Str "Nakano Masaki<namachan10777@gmail.com\n"

                            "icon" ->
                                Img ( "icon", "./res/icon.jpg", Just ( "@hsm_hx", "https://twitter.com/hsm_hx" ) )

                            _ ->
                                Str (String.append fname " is not a text file\n")

                    Succes ( Dir ( dname, _ ), p ) ->
                        Str (String.append dname " is a directory\n")

                    IsNotDir ( File ( fname, id ), p ) ->
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
execCd system arg =
    let
        implCd path =
            case resolvePath system path of
                Succes ( Dir ( _, _ ), normalized ) ->
                    ( Stdout [], { root = system.root, current = normalized } )

                NotFound ->
                    ( Stdout [ Str (path ++ " is not found") ], system )

                _ ->
                    ( Stdout [ Str (path ++ " is not a directory") ], system )
    in
    case arg of
        [] ->
            implCd "/home/namachan/"

        path :: [] ->
            implCd path

        _ ->
            ( Stdout [ Str "Too many args for cd" ], system )


execLs : System -> List String -> ( CmdResult, System )
execLs system paths =
    let
        _ =
            Debug.log "" ( system, paths )

        showDirIncludes path =
            case resolvePath system path of
                Succes ( Dir ( _, children ), _ ) ->
                    children
                        |> List.map
                            (\child ->
                                case child of
                                    File ( name, _ ) ->
                                        name

                                    Dir ( name, _ ) ->
                                        name
                            )
                        |> String.join " "

                NotFound ->
                    path ++ ": directory not found"

                _ ->
                    path ++ "is not a directory"
    in
    case paths of
        [] ->
            ( Stdout [ Str (showDirIncludes ".") ], system )

        path :: [] ->
            ( Stdout [ Str (showDirIncludes path) ], system )

        _ ->
            ( Stdout
                (paths
                    |> List.map
                        (\path ->
                            [ Str (path ++ ":")
                            , Str (showDirIncludes path)
                            ]
                        )
                    |> List.concat
                )
            , system
            )


execPwd : System -> List String -> ( CmdResult, System )
execPwd system args =
    case args of
        [] ->
            ( Stdout [ Str ((system.current |> String.join "/") ++ "/") ], system )

        _ ->
            ( Stdout [ Str "pwd: Expected 0 args, got 1" ], system )


exec : System -> String -> List String -> ( CmdResult, System )
exec system path args =
    case resolveExe system path of
        Succes ( File ( _, "echo" ), _ ) ->
            execEcho system args

        Succes ( File ( _, "cat" ), _ ) ->
            execCat system args

        Succes ( File ( _, "mv" ), _ ) ->
            execMv system args

        Succes ( File ( _, "rm" ), _ ) ->
            execRm system args

        Succes ( File ( _, "cd" ), _ ) ->
            execCd system args

        Succes ( File ( _, "ls" ), _ ) ->
            execLs system args

        Succes ( File ( _, "pwd" ), _ ) ->
            execPwd system args

        _ ->
            ( NoCmd, system )


enumerateCmds : System -> List String
enumerateCmds system =
    case resolvePath system exePath of
        Succes ( Dir ( _, files ), _ ) ->
            files
                |> List.filterMap
                    (\file ->
                        case file of
                            File ( name, _ ) ->
                                Just name

                            _ ->
                                Nothing
                    )

        _ ->
            []
