module FsTests exposing (fsTests)

import Expect
import Fs exposing (..)
import Os exposing (..)
import Path exposing (..)
import Test exposing (..)


bin : Fs
bin =
    Dir "bin"
        [ File "echo" "echo"
        , File "cd" "cd"
        ]


usr : Fs
usr =
    Dir "usr" [ bin ]


root : Fs
root =
    Dir ""
        [ File "root.txt" "root.txt"
        , usr
        ]


root2 : Fs
root2 =
    Dir ""
        [ File "root.txt" "root2.txt"
        , usr
        ]


root3 : Fs
root3 =
    Dir ""
        [ File "root3.txt" "root3.txt"
        , File "root.txt" "root.txt"
        , usr
        ]


root4 : Fs
root4 =
    Dir ""
        [ File "root.txt" "root.txt"
        , Dir
            "usr"
            [ File "usr.txt" "usr.txt"
            , bin
            ]
        ]


atUsr : System
atUsr =
    { root = root
    , current = [ "", "usr" ]
    }


atRoot : System
atRoot =
    { root = root
    , current = [ "" ]
    }


fsTests : Test
fsTests =
    describe "test Os module"
        [ describe "queryPathAbs"
            [ test "root" <|
                \_ -> Expect.equal (queryPathAbs root [ "" ]) (Just root)
            , test "root.txt" <|
                \_ -> Expect.equal (queryPathAbs root [ "", "root.txt" ]) (Just (File "root.txt" "root.txt"))
            , test "usr bin" <|
                \_ -> Expect.equal (queryPathAbs root [ "", "usr", "bin" ]) (Just bin)
            , test "fail" <|
                \_ -> Expect.equal (queryPathAbs root [ "", "usr", "bi" ]) Nothing
            ]
        , describe "resolvePath"
            [ test "root" <|
                \_ -> Expect.equal (resolvePath atRoot "/") (Succes root [ "" ])
            , test "root.txt" <|
                \_ -> Expect.equal (resolvePath atUsr "/root.txt") (Succes (File "root.txt" "root.txt") [ "", "root.txt" ])
            , test "root.txt not dir" <|
                \_ -> Expect.equal (resolvePath atUsr "/root.txt/") (IsNotDir (File "root.txt" "root.txt") [ "", "root.txt" ])
            , test "echo" <|
                \_ -> Expect.equal (resolvePath atUsr "/usr/bin/echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative echo" <|
                \_ -> Expect.equal (resolvePath atUsr "bin/echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative echo not dir" <|
                \_ -> Expect.equal (resolvePath atUsr "bin/echo/") (IsNotDir (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative echo 2" <|
                \_ -> Expect.equal (resolvePath atUsr "./bin/echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative dir" <|
                \_ -> Expect.equal (resolvePath atUsr "./bin/") (Succes bin [ "", "usr", "bin" ])
            , test "here 2" <|
                \_ -> Expect.equal (resolvePath atUsr ".") (Succes usr [ "", "usr" ])
            , test "here 1" <|
                \_ -> Expect.equal (resolvePath atUsr "./") (Succes usr [ "", "usr" ])
            , test "relative root.txt" <|
                \_ -> Expect.equal (resolvePath atUsr "../root.txt") (Succes (File "root.txt" "root.txt") [ "", "root.txt" ])
            , test "not found" <|
                \_ -> Expect.equal (resolvePath atRoot "/usr/bin/ech") NotFound
            ]
        , describe "resolveExe"
            [ test "absulute echo" <|
                \_ -> Expect.equal (resolveExe atUsr "/usr/bin/echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative echo" <|
                \_ -> Expect.equal (resolveExe atUsr "./bin/echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "path echo" <|
                \_ -> Expect.equal (resolveExe atUsr "echo") (Succes (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            , test "relative echo IsNotDir" <|
                \_ -> Expect.equal (resolveExe atUsr "./bin/echo/") (IsNotDir (File "echo" "echo") [ "", "usr", "bin", "echo" ])
            ]
        , describe "toAbsolute"
            [ test "reltive" <|
                \_ -> Expect.equal (toAbsolute [ "", "usr" ] [ ".", "foo", "bar" ]) (Just [ "", "usr", "foo", "bar" ])
            , test "parent" <|
                \_ -> Expect.equal (toAbsolute [ "" ] [ "foo", "..", "bar" ]) (Just [ "", "bar" ])
            , test "complex" <|
                \_ -> Expect.equal (toAbsolute [ "" ] [ ".", "foo", "..", "bar", ".." ]) (Just [ "" ])
            , test "root of root" <|
                \_ -> Expect.equal (toAbsolute [ "" ] [ ".", "foo", "..", "bar", "..", ".." ]) (Just [])
            , test "nowhere" <|
                \_ -> Expect.equal (toAbsolute [ "" ] [ ".", "foo", "..", "..", "bar", "..", ".." ]) Nothing
            ]
        , describe "overwriteFile"
            [ test "overwrite root.txt" <|
                \_ ->
                    Expect.equal (overwriteFile [ "" ] (File "root.txt" "root2.txt") root)
                        root2
            , test "make root3.txt" <|
                \_ -> Expect.equal (overwriteFile [ "" ] (File "root3.txt" "root3.txt") root) root3
            , test "make in subdir" <|
                \_ -> Expect.equal (overwriteFile [ "", "usr" ] (File "usr.txt" "usr.txt") root) root4
            ]
        ]
