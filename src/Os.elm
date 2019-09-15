module Os exposing (..)

import Fs
import Path


type alias System =
    { root : Fs.Fs
    , current : Fs.AbsolutePath
    }


exePath : String
exePath =
    "/usr/bin/"


initialFs : Fs.Fs
initialFs =
    Fs.Dir
        ( ""
        , [ Fs.Dir
                ( "usr"
                , [ Fs.Dir
                        ( "bin"
                        , [ Fs.File ( "echo", "echo" )
                          , Fs.File ( "cat", "cat" )
                          , Fs.File ( "mv", "mv" )
                          , Fs.File ( "rm", "rm" )
                          , Fs.File ( "cd", "cd" )
                          , Fs.File ( "ls", "ls" )
                          , Fs.File ( "pwd", "pwd" )
                          ]
                        )
                  ]
                )
          , Fs.Dir
                ( "home"
                , [ Fs.Dir
                        ( "namachan"
                        , [ Fs.File ( "icon", "icon" )
                          , Fs.File ( "basic-info", "basic-info" )
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


type Resolved
    = Succes ( Fs.Fs, Fs.AbsolutePath )
    | IsNotDir ( Fs.Fs, Fs.AbsolutePath )
    | NotFound


resolvePath : System -> String -> Resolved
resolvePath system path =
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" path then
                ( True, String.dropRight 1 path )

            else
                ( False, path )

        absPath =
            shrinked
                |> String.split "/"
                |> Path.toAbsolute system.current
                |> Maybe.withDefault []
    in
    case ( dirExpect, Fs.queryPathAbs system.root absPath ) of
        ( True, Just ((Fs.File _) as f) ) ->
            IsNotDir ( f, absPath )

        ( _, Just f ) ->
            Succes ( f, absPath )

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
                    Succes ( Fs.File ( fname, id ), p ) ->
                        case id of
                            "basic-info" ->
                                Str "Nakano Masaki<namachan10777@gmail.com\n"

                            "icon" ->
                                Img ( "icon", "./res/icon.jpg", Just ( "@hsm_hx", "https://twitter.com/hsm_hx" ) )

                            _ ->
                                Str (String.append fname " is not a text file\n")

                    Succes ( Fs.Dir ( dname, _ ), p ) ->
                        Str (String.append dname " is a directory\n")

                    IsNotDir ( Fs.File ( fname, id ), p ) ->
                        Str (String.append fname " is not a directory\n")

                    _ ->
                        Str (String.append arg " is not found\n")
            )
        |> (\outputs -> ( Stdout outputs, system ))


dropRight : Int -> List a -> List a
dropRight n l =
    l |> List.reverse |> List.drop n |> List.reverse


implMv : Bool -> System -> String -> String -> ( Maybe Output, System )
implMv isSingleArg system src dest =
    case ( isSingleArg, resolvePath system src, resolvePath system dest ) of
        ( _, NotFound, _ ) ->
            ( Just (Str ("mv: cannot stat " ++ src ++ ": No such file or directory")), system )

        ( _, IsNotDir _, _ ) ->
            ( Just (Str ("mv: cannot stat " ++ src ++ ": Not a directory")), system )

        ( _, Succes ( Fs.Dir _, _ ), Succes ( Fs.File _, _ ) ) ->
            ( Just (Str ("mv: cannot overwrte non-directory " ++ dest ++ ": with directory" ++ src)), system )

        ( _, Succes ( file, srcAbs ), IsNotDir _ ) ->
            ( Just (Str ("mv: failed to acces" ++ dest ++ ": Not a directory")), system )

        ( False, _, Succes ( Fs.File _, _ ) ) ->
            ( Just (Str ("mv: target " ++ dest ++ "is not a directory")), system )

        ( False, _, NotFound ) ->
            ( Just (Str ("mv: failed to acces" ++ dest ++ ": Not a directory")), system )

        ( _, Succes ( file, srcAbs ), Succes ( Fs.Dir _, destAbs ) ) ->
            ( Nothing, { system | root = system.root |> Fs.overwriteFile destAbs file |> Fs.removeFile srcAbs } )

        ( _, Succes ( file, srcAbs ), Succes ( Fs.File ( name, _ ), destAbs ) ) ->
            ( Nothing
            , { system
                | root =
                    system.root
                        |> Fs.overwriteFile (dropRight 1 destAbs) (Fs.changeName file name)
                        |> Fs.removeFile srcAbs
              }
            )

        ( _, Succes ( file, srcAbs ), _ ) ->
            case Path.toAbsolute system.current (String.split "/" dest) of
                Nothing ->
                    ( Just (Str ("mv: failed to acces " ++ dest ++ ": No such a directory")), system )

                Just destAbs ->
                    let
                        name =
                            destAbs |> List.reverse |> List.head |> Maybe.withDefault ""
                    in
                    ( Nothing
                    , { system
                        | root =
                            system.root
                                |> Fs.overwriteFile (dropRight 1 destAbs) (Fs.changeName file name)
                                |> Fs.removeFile srcAbs
                      }
                    )


execMv : System -> List String -> ( CmdResult, System )
execMv system args =
    case List.reverse args of
        [] ->
            ( Stdout [ Str "mv: missing file operand" ], system )

        src :: [] ->
            ( Stdout [ Str ("mv: missing file destination operand after " ++ src) ], system )

        dest :: src :: [] ->
            let
                ( output, updatedSystem ) =
                    implMv True system src dest
            in
            ( Stdout ([ output ] |> List.filterMap identity), updatedSystem )

        dest :: srcs ->
            let
                ( outputs, updatedSystem ) =
                    srcs
                        |> List.reverse
                        |> List.foldl
                            (\src ( acc, sys ) ->
                                let
                                    ( output, nextSys ) =
                                        implMv False sys src dest
                                in
                                ( output :: acc, nextSys )
                            )
                            ( [], system )
            in
            ( Stdout (outputs |> List.filterMap identity), updatedSystem )


execRm : System -> List String -> ( CmdResult, System )
execRm system _ =
    ( NoCmd, system )


execCd : System -> List String -> ( CmdResult, System )
execCd system arg =
    let
        implCd path =
            case resolvePath system path of
                Succes ( Fs.Dir ( _, _ ), normalized ) ->
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
        showDirIncludes path =
            case resolvePath system path of
                Succes ( Fs.Dir ( _, children ), _ ) ->
                    children
                        |> List.map
                            (\child ->
                                case child of
                                    Fs.File ( name, _ ) ->
                                        name

                                    Fs.Dir ( name, _ ) ->
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
        Succes ( Fs.File ( _, "echo" ), _ ) ->
            execEcho system args

        Succes ( Fs.File ( _, "cat" ), _ ) ->
            execCat system args

        Succes ( Fs.File ( _, "mv" ), _ ) ->
            execMv system args

        Succes ( Fs.File ( _, "rm" ), _ ) ->
            execRm system args

        Succes ( Fs.File ( _, "cd" ), _ ) ->
            execCd system args

        Succes ( Fs.File ( _, "ls" ), _ ) ->
            execLs system args

        Succes ( Fs.File ( _, "pwd" ), _ ) ->
            execPwd system args

        _ ->
            ( NoCmd, system )


enumerateCmds : System -> Fs.Path
enumerateCmds system =
    case resolvePath system exePath of
        Succes ( Fs.Dir ( _, files ), _ ) ->
            files
                |> List.filterMap
                    (\file ->
                        case file of
                            Fs.File ( name, _ ) ->
                                Just name

                            _ ->
                                Nothing
                    )

        _ ->
            []
